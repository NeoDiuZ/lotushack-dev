/*
 * attention_states.h
 * FocusIQ – attention state definitions, thresholds, and shared types.
 *
 * State mapping:
 *   ATTENTION_HIGH_FOCUS  → BLE sends "H"   (Very Focused in FocusIQ.jsx: "focused")
 *   ATTENTION_UNFOCUS     → BLE sends "U"   (Mid Focus in FocusIQ.jsx:    "unfocused")
 *   ATTENTION_FATIGUED    → BLE sends "F"   (Not Focused in FocusIQ.jsx:  "fatigued")
 */
#pragma once

#include <stdint.h>
#include <stdbool.h>

/* ── Attention states ────────────────────────────────────────────────── */
typedef enum {
    ATTENTION_FATIGUED    = 0,   /* focus_pct  < 13  – "F" – Not Focused  */
    ATTENTION_UNFOCUS     = 1,   /* focus_pct 13–24  – "U" – Mid Focus     */
    ATTENTION_HIGH_FOCUS  = 2,   /* focus_pct >= 25  – "H" – Very Focused  */
} attention_state_t;

/* ── BLE single-character state codes ───────────────────────────────── */
#define BLE_STATE_HIGH_FOCUS   "H"
#define BLE_STATE_UNFOCUS      "U"
#define BLE_STATE_FATIGUED     "F"

/* ── Classification thresholds (%) – match original FocusIQ.jsx ─────── */
#define FOCUS_THRESHOLD_HIGH   25    /* >= 25 → HIGH_FOCUS               */
#define FOCUS_THRESHOLD_MID    13    /* >= 13 → UNFOCUS, < 13 → FATIGUED */

/* ── Rolling average window ─────────────────────────────────────────── */
#define FOCUS_HISTORY_LEN       5

/* ── Hysteresis / debounce ───────────────────────────────────────────── */
#define STATE_MIN_DURATION_MS  2000   /* state must hold before switching */
#define BUZZER_DEBOUNCE_MS     1500   /* min ms between buzzer toggles    */

/* ── EEG band indices ────────────────────────────────────────────────── */
#define BAND_DELTA  0
#define BAND_THETA  1
#define BAND_ALPHA  2
#define BAND_BETA   3
#define BAND_GAMMA  4
#define NUM_BANDS   5

/* ── Shared data record ──────────────────────────────────────────────── */
typedef struct {
    attention_state_t state;
    uint8_t           focus_pct;
    uint8_t           band_power[NUM_BANDS];
    bool              buzzer_active;
} attention_data_t;
