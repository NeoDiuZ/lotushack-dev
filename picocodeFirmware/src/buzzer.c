/*
 * buzzer.c
 */
#include "buzzer.h"
#include "pico/stdlib.h"
#include "hardware/pwm.h"
#include "hardware/gpio.h"

static bool s_active = false;

void buzzer_init(void) {
#if BUZZER_USE_PWM
    gpio_set_function(BUZZER_GPIO, GPIO_FUNC_PWM);
    uint slice = pwm_gpio_to_slice_num(BUZZER_GPIO);
    /*
     * sys_clk = 125 MHz (Pico default)
     * wrap = 125 000 000 / 2000 - 1 = 62 499
     * clkdiv = 1.0
     */
    pwm_config cfg = pwm_get_default_config();
    pwm_config_set_clkdiv(&cfg, 1.0f);
    pwm_config_set_wrap(&cfg, 62499u);
    pwm_init(slice, &cfg, false);
    pwm_set_gpio_level(BUZZER_GPIO, 0u);
#else
    gpio_init(BUZZER_GPIO);
    gpio_set_dir(BUZZER_GPIO, GPIO_OUT);
    gpio_put(BUZZER_GPIO, 0);
#endif
}

void buzzer_set(bool active) {
    if (active == s_active) return;
    s_active = active;
#if BUZZER_USE_PWM
    uint slice = pwm_gpio_to_slice_num(BUZZER_GPIO);
    if (active) {
        pwm_set_gpio_level(BUZZER_GPIO, 31250u); /* 50% duty */
        pwm_set_enabled(slice, true);
    } else {
        pwm_set_enabled(slice, false);
        pwm_set_gpio_level(BUZZER_GPIO, 0u);
    }
#else
    gpio_put(BUZZER_GPIO, active ? 1u : 0u);
#endif
}

bool buzzer_get(void) { return s_active; }
