/*
 * pam8403.c
 */
#include "pam8403.h"
#include "pico/stdlib.h"
#include "pico/time.h"
#include "hardware/pwm.h"
#include "hardware/gpio.h"
#include "hardware/clocks.h"

static pam8403_tone_t s_tone        = PAM8403_TONE_NONE;
static uint32_t       s_tone_end_ms = 0;

static const uint32_t TONE_HZ[4] = { 0u, 1047u, 523u, 261u };

static void apply_freq(uint32_t freq_hz) {
    uint slice = pwm_gpio_to_slice_num(PAM8403_AUDIO_GPIO);
    if (freq_hz == 0u) {
        pwm_set_enabled(slice, false);
        pwm_set_gpio_level(PAM8403_AUDIO_GPIO, 0u);
        return;
    }
    uint32_t sys_clk = clock_get_hz(clk_sys);
    uint32_t div  = 1u;
    uint32_t wrap = sys_clk / freq_hz;
    while (wrap > 65535u && div < 256u) { div++; wrap = sys_clk / (freq_hz * div); }
    if (wrap < 1u) wrap = 1u;
    pwm_set_clkdiv_int_frac(slice, (uint8_t)div, 0u);
    pwm_set_wrap(slice, (uint16_t)(wrap - 1u));
    pwm_set_gpio_level(PAM8403_AUDIO_GPIO, (uint16_t)((wrap - 1u) / 2u));
    pwm_set_enabled(slice, true);
}

void pam8403_init(void) {
    gpio_init(PAM8403_STANDBY_GPIO);
    gpio_set_dir(PAM8403_STANDBY_GPIO, GPIO_OUT);
    gpio_put(PAM8403_STANDBY_GPIO, 1u); /* standby by default */

    gpio_set_function(PAM8403_AUDIO_GPIO, GPIO_FUNC_PWM);
    uint slice = pwm_gpio_to_slice_num(PAM8403_AUDIO_GPIO);
    pwm_config cfg = pwm_get_default_config();
    pwm_config_set_clkdiv(&cfg, 1.0f);
    pwm_config_set_wrap(&cfg, 62499u);
    pwm_init(slice, &cfg, false);
}

void pam8403_play_tone(pam8403_tone_t tone, uint32_t duration_ms) {
    if (tone == PAM8403_TONE_NONE) { pam8403_stop(); return; }
    gpio_put(PAM8403_STANDBY_GPIO, 0u); /* enable amp */
    s_tone        = tone;
    s_tone_end_ms = to_ms_since_boot(get_absolute_time()) + duration_ms;
    apply_freq(TONE_HZ[tone]);
}

void pam8403_stop(void) {
    apply_freq(0u);
    gpio_put(PAM8403_STANDBY_GPIO, 1u);
    s_tone = PAM8403_TONE_NONE;
}

void pam8403_update(void) {
    if (s_tone != PAM8403_TONE_NONE &&
        to_ms_since_boot(get_absolute_time()) >= s_tone_end_ms) {
        pam8403_stop();
    }
}
