/*
 * buzzer.h
 * Passive piezo buzzer driven by Pico PWM on GP15.
 *
 * Wiring: GP15 → 100 Ω → Buzzer+ → Buzzer− → GND
 *
 * Sounds when attention state = ATTENTION_NOT_FOCUSED ("Not Focused").
 * Debounce is applied in main.c (BUZZER_DEBOUNCE_MS).
 *
 * Set BUZZER_USE_PWM 0 for an active (self-oscillating) buzzer –
 * GPIO is then driven high/low; the buzzer generates its own frequency.
 */
#pragma once

#include <stdint.h>
#include <stdbool.h>

#define BUZZER_GPIO      15
#define BUZZER_USE_PWM    1     /* 1 = PWM tone (passive), 0 = GPIO (active) */
#define BUZZER_TONE_HZ 2000

void buzzer_init(void);
void buzzer_set(bool active);
bool buzzer_get(void);
