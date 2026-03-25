/*
 * main.c
 * FocusIQ – Pico W firmware entry point.
 *
 * Flow:
 *   sample_timer fires every 4 ms (250 Hz)
 *     → reads ADS1115
 *     → sp_add_sample()  [FFT runs automatically every 256 samples = 1 s]
 *     → if state changed: send "H" / "F" / "U" over BLE immediately
 *     → update buzzer + PAM8403
 */
#include "pico/stdlib.h"
#include "pico/cyw43_arch.h"
#include "pico/time.h"
#include "btstack.h"
#include <stdio.h>

#include "attention_states.h"
#include "ads1115.h"
#include "signal_processing.h"
#include "buzzer.h"
#include "pam8403.h"
#include "ble_service.h"

/* ── Module instances ────────────────────────────────────────────────── */
static ads1115_t          s_adc;
static signal_processor_t s_sp;
static attention_data_t   s_attention;

/* ── BTstack timer ───────────────────────────────────────────────────── */
static btstack_timer_source_t s_sample_timer;

/* ── Hysteresis state ────────────────────────────────────────────────── */
static uint32_t          s_last_buzzer_ms  = 0;
static attention_state_t s_last_pam_state  = ATTENTION_HIGH_FOCUS;

/* ── BLE control callback ────────────────────────────────────────────── */
static void on_ble_command(uint8_t cmd) {
    switch (cmd) {
    case BLE_CMD_BUZZER_ON:  buzzer_set(true);  break;
    case BLE_CMD_BUZZER_OFF: buzzer_set(false); break;
    default: break;
    }
}

/* ── Sample timer (250 Hz) ───────────────────────────────────────────── */
static void sample_timer_handler(btstack_timer_source_t *ts) {
    uint32_t now_ms = to_ms_since_boot(get_absolute_time());

    /* 1. Read ADC */
    int16_t raw = ads1115_read_raw(&s_adc);

    /* 2. Feed into FFT pipeline (FFT runs every 256 samples = ~1 s) */
    sp_add_sample(&s_sp, raw, now_ms);
    sp_get_attention_data(&s_sp, &s_attention);

    /* 3. Send BLE notification ONLY when state changes */
    if (sp_consume_state_changed(&s_sp)) {
        ble_service_notify_attention(&s_attention);
        printf("[STATE] %s  focus=%.1f%%\n",
               s_attention.state == ATTENTION_HIGH_FOCUS ? "H (High Focus)" :
               s_attention.state == ATTENTION_UNFOCUS    ? "U (Unfocus)"    :
                                                           "F (Fatigued)",
               s_sp.focus_score_avg);
    }

    /* 4. Buzzer: ON for Fatigued, OFF otherwise, with debounce */
    bool should_buzz = (s_attention.state == ATTENTION_FATIGUED);
    if (buzzer_get() != should_buzz &&
        (now_ms - s_last_buzzer_ms) >= BUZZER_DEBOUNCE_MS) {
        buzzer_set(should_buzz);
        s_last_buzzer_ms = now_ms;
    }

    /* 5. PAM8403 one-shot tone on state transition */
    if (s_attention.state != s_last_pam_state) {
        s_last_pam_state = s_attention.state;
        switch (s_attention.state) {
        case ATTENTION_HIGH_FOCUS: pam8403_play_tone(PAM8403_TONE_FOCUSED,  300); break;
        case ATTENTION_UNFOCUS:    pam8403_play_tone(PAM8403_TONE_MID,      200); break;
        case ATTENTION_FATIGUED:   pam8403_play_tone(PAM8403_TONE_FATIGUED, 500); break;
        }
    }

    /* 6. Expire timed PAM8403 tones */
    pam8403_update();

    btstack_run_loop_set_timer(ts, SP_SAMPLE_INTERVAL_MS);
    btstack_run_loop_add_timer(ts);
}

/* ── Entry point ─────────────────────────────────────────────────────── */
int main(void) {
    stdio_init_all();
    printf("\n=== FocusIQ Pico W ===  built %s %s\n", __DATE__, __TIME__);

    buzzer_init();
    pam8403_init();
    sp_init(&s_sp);

    /* CYW43 must be initialised before LED fault indicator */
    if (cyw43_arch_init()) {
        printf("[FATAL] cyw43_arch_init failed\n");
        while (true) tight_loop_contents();
    }

    /* ADS1115 – halt with rapid LED blink if not found */
    if (!ads1115_init(&s_adc)) {
        printf("[FATAL] ADS1115 not found – check SDA GP4, SCL GP5, pull-ups, VDD\n");
        while (true) {
            cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 1); sleep_ms(100);
            cyw43_arch_gpio_put(CYW43_WL_GPIO_LED_PIN, 0); sleep_ms(100);
        }
    }
    ads1115_start_continuous(&s_adc, 0);
    printf("[INFO] ADS1115 ready, ch0 continuous 860 SPS\n");

    ble_service_init(on_ble_command);

    btstack_run_loop_set_timer_handler(&s_sample_timer, sample_timer_handler);
    btstack_run_loop_set_timer(&s_sample_timer, SP_SAMPLE_INTERVAL_MS);
    btstack_run_loop_add_timer(&s_sample_timer);

    hci_power_control(HCI_POWER_ON);
    printf("[INFO] BLE advertising as '%s'\n", BLE_DEVICE_NAME);

    btstack_run_loop_execute();
    return 0;
}
