/*
 * signal_processing.c
 * FFT-based EEG band power and attention state classification.
 */
#include "signal_processing.h"
#include <math.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

/* ── Helpers ─────────────────────────────────────────────────────────── */
static inline float clampf(float v, float lo, float hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

/* ── Radix-2 in-place DIT FFT ────────────────────────────────────────── */
static void fft_radix2(float *re, float *im, int N) {
    /* Bit-reversal permutation */
    for (int i = 1, j = 0; i < N; i++) {
        int bit = N >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            float t;
            t = re[i]; re[i] = re[j]; re[j] = t;
            t = im[i]; im[i] = im[j]; im[j] = t;
        }
    }
    /* Butterfly stages */
    for (int len = 2; len <= N; len <<= 1) {
        float ang = -(float)M_PI / (float)(len >> 1);
        float wre = cosf(ang), wim = sinf(ang);
        for (int i = 0; i < N; i += len) {
            float cur_re = 1.0f, cur_im = 0.0f;
            for (int j = 0; j < (len >> 1); j++) {
                int a = i + j, b = i + j + (len >> 1);
                float ure = re[a], uim = im[a];
                float vre = re[b] * cur_re - im[b] * cur_im;
                float vim = re[b] * cur_im + im[b] * cur_re;
                re[a] = ure + vre;  im[a] = uim + vim;
                re[b] = ure - vre;  im[b] = uim - vim;
                float nre = cur_re * wre - cur_im * wim;
                cur_im   = cur_re * wim + cur_im * wre;
                cur_re   = nre;
            }
        }
    }
}

/* ── Hanning window coefficient ─────────────────────────────────────── */
static inline float hanning(int n, int N) {
    return 0.5f * (1.0f - cosf(2.0f * (float)M_PI * (float)n / (float)(N - 1)));
}

/* ── Sum power spectrum over a bin range ─────────────────────────────── */
static float band_power_sum(const float *re, const float *im, int lo, int hi) {
    float sum = 0.0f;
    for (int k = lo; k <= hi; k++)
        sum += re[k] * re[k] + im[k] * im[k];
    return sum;
}

/* ── Public functions ────────────────────────────────────────────────── */

void sp_init(signal_processor_t *sp) {
    memset(sp, 0, sizeof(*sp));
    sp->current_state = ATTENTION_FATIGUED;
    sp->state_changed = false;
}

void sp_add_sample(signal_processor_t *sp, int16_t raw_adc, uint32_t now_ms) {
    /* 1. Store normalised sample into circular buffer */
    sp->sample_buf[sp->buf_idx] = (float)raw_adc / 32768.0f;
    sp->buf_idx++;

    /* Wait until we have a full 256-sample window (~1 second) */
    if (sp->buf_idx < FFT_SIZE) return;
    sp->buf_idx = 0;

    /* 2. Apply Hanning window and load into FFT buffers */
    for (int i = 0; i < FFT_SIZE; i++) {
        sp->fft_re[i] = sp->sample_buf[i] * hanning(i, FFT_SIZE);
        sp->fft_im[i] = 0.0f;
    }

    /* 3. Run FFT */
    fft_radix2(sp->fft_re, sp->fft_im, FFT_SIZE);

    /* 4. Compute raw band power (sum of |X[k]|²) */
    float raw_bp[NUM_BANDS];
    raw_bp[BAND_DELTA] = band_power_sum(sp->fft_re, sp->fft_im, DELTA_BIN_LO, DELTA_BIN_HI);
    raw_bp[BAND_THETA] = band_power_sum(sp->fft_re, sp->fft_im, THETA_BIN_LO, THETA_BIN_HI);
    raw_bp[BAND_ALPHA] = band_power_sum(sp->fft_re, sp->fft_im, ALPHA_BIN_LO, ALPHA_BIN_HI);
    raw_bp[BAND_BETA]  = band_power_sum(sp->fft_re, sp->fft_im, BETA_BIN_LO,  BETA_BIN_HI);
    raw_bp[BAND_GAMMA] = band_power_sum(sp->fft_re, sp->fft_im, GAMMA_BIN_LO, GAMMA_BIN_HI);

    /* 5. Normalise to relative band power (all bands sum to ~100%).
     *    This makes the focus score calibration-independent – no scale
     *    factor needed, works regardless of input amplitude.            */
    float total = 0.0f;
    for (int i = 0; i < NUM_BANDS; i++) total += raw_bp[i];
    total += 1e-9f;
    for (int i = 0; i < NUM_BANDS; i++)
        sp->band_power[i] = clampf(raw_bp[i] / total * 100.0f, 0.0f, 100.0f);

    /* 6. Focus score = relative beta power (%).
     *    During alert focus, beta typically holds 25-40% of spectrum.
     *    Penalise if delta dominates (drowsy / very low frequency noise).
     *    Thresholds 13 / 25 from original FocusIQ.jsx apply directly.  */
    float focus_score = sp->band_power[BAND_BETA];
    if (sp->band_power[BAND_DELTA] > 40.0f)
        focus_score *= 0.5f;  /* delta-dominant = drowsy, penalise */

    /* 7. Rolling 5-reading average – mirrors original FocusIQ.jsx      */
    sp->focus_history[sp->history_idx] = focus_score;
    sp->history_idx = (sp->history_idx + 1u) % FOCUS_HISTORY_LEN;
    if (sp->history_count < FOCUS_HISTORY_LEN) sp->history_count++;

    float sum = 0.0f;
    for (uint8_t i = 0; i < sp->history_count; i++) sum += sp->focus_history[i];
    sp->focus_score_avg = sum / (float)sp->history_count;

    /* 8. Classify with minimum-duration hysteresis (2 s)               */
    attention_state_t candidate;
    float avg = sp->focus_score_avg;
    if      (avg >= (float)FOCUS_THRESHOLD_HIGH) candidate = ATTENTION_HIGH_FOCUS;
    else if (avg >= (float)FOCUS_THRESHOLD_MID)  candidate = ATTENTION_UNFOCUS;
    else                                          candidate = ATTENTION_FATIGUED;

    if (candidate != sp->current_state) {
        if ((now_ms - sp->state_entry_ms) >= STATE_MIN_DURATION_MS) {
            sp->current_state  = candidate;
            sp->state_entry_ms = now_ms;
            sp->state_changed  = true;   /* BLE notification needed */
        }
    } else {
        sp->state_entry_ms = now_ms;
    }
}

void sp_get_attention_data(const signal_processor_t *sp, attention_data_t *out) {
    out->state     = sp->current_state;
    out->focus_pct = (uint8_t)clampf(sp->focus_score_avg, 0.0f, 100.0f);
    for (int i = 0; i < NUM_BANDS; i++)
        out->band_power[i] = (uint8_t)clampf(sp->band_power[i], 0.0f, 100.0f);
    out->buzzer_active = (sp->current_state == ATTENTION_FATIGUED);
}

bool sp_consume_state_changed(signal_processor_t *sp) {
    bool changed = sp->state_changed;
    sp->state_changed = false;
    return changed;
}
