/*
 * signal_processing.h
 * EEG signal processing pipeline – FFT-based band power + attention classify.
 *
 * Pipeline:
 *   Collect 256 samples at 250 SPS (1 second window)
 *   → Hanning window
 *   → 256-point radix-2 FFT
 *   → Sum power spectrum per EEG band (delta/theta/alpha/beta/gamma)
 *   → Normalise to relative band power (all bands sum to 100%)
 *   → Focus score = relative beta power (%)
 *   → 5-reading rolling average
 *   → Classify: H / F / U with 2 s hysteresis
 *   → Set state_changed flag when state flips (drives BLE send)
 *
 * Band bin mapping for FFT_SIZE=256, Fs=250 Hz
 *   Frequency resolution = 250/256 ≈ 0.977 Hz per bin
 *   Delta  0.5–4   Hz : bins  1–4
 *   Theta  4–8     Hz : bins  5–8
 *   Alpha  8–12    Hz : bins  9–12
 *   Beta   12–30   Hz : bins 13–30
 *   Gamma  30–100  Hz : bins 31–102
 */
#pragma once

#include "attention_states.h"
#include <stdint.h>
#include <stdbool.h>

/* ── Sampling ────────────────────────────────────────────────────────── */
#define SP_SAMPLE_RATE_HZ      250
#define SP_SAMPLE_INTERVAL_MS    4    /* 1000 / 250 */

/* ── FFT config ──────────────────────────────────────────────────────── */
#define FFT_SIZE        256           /* must be power of 2               */
#define FFT_FS          250.0f        /* Hz                               */
/* bin k → frequency k * (250/256) Hz                                    */

/* Band bin ranges (inclusive) */
#define DELTA_BIN_LO     1
#define DELTA_BIN_HI     4
#define THETA_BIN_LO     5
#define THETA_BIN_HI     8
#define ALPHA_BIN_LO     9
#define ALPHA_BIN_HI    12
#define BETA_BIN_LO     13
#define BETA_BIN_HI     30
#define GAMMA_BIN_LO    31
#define GAMMA_BIN_HI   102

/* ── Focus score thresholds (relative beta %) ───────────────────────── */
/* These work without calibration because band_power[] are relative.
 * During genuine focus, beta typically occupies 25–40% of EEG spectrum.
 * These values match the original FocusIQ.jsx thresholds (13 / 25).    */

/* ── Processor state ─────────────────────────────────────────────────── */
typedef struct {
    /* Sample accumulation buffer */
    float    sample_buf[FFT_SIZE];

    /* FFT working buffers (re-used per window) */
    float    fft_re[FFT_SIZE];
    float    fft_im[FFT_SIZE];

    uint16_t buf_idx;          /* next write position in sample_buf       */

    /* Per-window outputs (updated once per FFT run = once per second)   */
    float    band_power[NUM_BANDS];   /* relative %, sums to ~100          */

    /* Focus score rolling history */
    float    focus_history[FOCUS_HISTORY_LEN];
    uint8_t  history_idx;
    uint8_t  history_count;
    float    focus_score_avg;         /* used for classification           */

    /* Attention state */
    attention_state_t current_state;
    uint32_t          state_entry_ms;
    bool              state_changed;  /* cleared by sp_consume_state_changed */
} signal_processor_t;

/* ── API ─────────────────────────────────────────────────────────────── */
void sp_init(signal_processor_t *sp);

/* Call every SP_SAMPLE_INTERVAL_MS.  FFT + classify run automatically
 * when the 256-sample window is full (~every 1 second).                 */
void sp_add_sample(signal_processor_t *sp, int16_t raw_adc, uint32_t now_ms);

void sp_get_attention_data(const signal_processor_t *sp, attention_data_t *out);

/* Returns true (and resets the flag) when state changed since last call. */
bool sp_consume_state_changed(signal_processor_t *sp);
