/*
 * pam8403.h
 * PAM8403 Class-D audio amplifier driver.
 *
 * Role in this design
 * ───────────────────
 * The PAM8403 drives a small speaker for one-shot STATE-CHANGE TONES.
 * It is NOT the alert buzzer (that is GP15, separate).
 *
 *   Very Focused  → 1047 Hz chime,   300 ms  (C6)
 *   Mid Focus     →  523 Hz tone,    200 ms  (C5)
 *   Not Focused   →  261 Hz warning, 500 ms  (C4)
 *
 * Wiring
 * ──────
 *   GP16 → 1 kΩ → 10 nF to GND → PAM8403 Left IN+
 *   GND  ───────────────────────→ PAM8403 Left IN−
 *   GP17 ───────────────────────→ PAM8403 /STBY  (LOW = on, HIGH = standby)
 *   PAM8403 LOUT+/− → 4-8 Ω speaker
 *   PAM8403 VDD → 3.3 V or 5 V (VBUS)
 *
 * Audio quality note: Pico PWM generates a square wave. The RC filter
 * (1 kΩ + 10 nF, fc ≈ 15.9 kHz) removes high harmonics before the amp.
 * For richer audio on a production device, use a DAC + I2S amplifier.
 */
#pragma once

#include <stdint.h>
#include <stdbool.h>

#define PAM8403_AUDIO_GPIO    16   /* GP16: PWM square-wave output */
#define PAM8403_STANDBY_GPIO  17   /* GP17: /STBY active-low       */

typedef enum {
    PAM8403_TONE_NONE     = 0,
    PAM8403_TONE_FOCUSED  = 1,   /* 1047 Hz */
    PAM8403_TONE_MID      = 2,   /*  523 Hz */
    PAM8403_TONE_FATIGUED = 3,   /*  261 Hz */
} pam8403_tone_t;

void pam8403_init(void);
void pam8403_play_tone(pam8403_tone_t tone, uint32_t duration_ms);
void pam8403_stop(void);
void pam8403_update(void);   /* call periodically to expire timed tones */
