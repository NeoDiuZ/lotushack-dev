/*
 * ads1115.c
 * ADS1115 driver implementation.
 */
#include "ads1115.h"
#include "pico/stdlib.h"

static bool reg_write(ads1115_t *dev, uint8_t reg, uint16_t value) {
    uint8_t buf[3] = { reg, (uint8_t)(value >> 8), (uint8_t)(value & 0xFFu) };
    return i2c_write_blocking(dev->i2c, dev->addr, buf, 3, false) == 3;
}

static bool reg_select(ads1115_t *dev, uint8_t reg) {
    return i2c_write_blocking(dev->i2c, dev->addr, &reg, 1, false) == 1;
}

bool ads1115_init(ads1115_t *dev) {
    dev->i2c  = ADS1115_I2C;
    dev->addr = ADS1115_ADDR;
    dev->pga  = ADS1115_PGA_2048MV;

    i2c_init(dev->i2c, ADS1115_I2C_BAUD);
    gpio_set_function(ADS1115_SDA_PIN, GPIO_FUNC_I2C);
    gpio_set_function(ADS1115_SCL_PIN, GPIO_FUNC_I2C);
    gpio_pull_up(ADS1115_SDA_PIN);
    gpio_pull_up(ADS1115_SCL_PIN);
    sleep_ms(10);

    /* Probe: attempt pointer write; returns false if no ACK (not present) */
    uint8_t probe = ADS1115_REG_CONFIG;
    return i2c_write_blocking(dev->i2c, dev->addr, &probe, 1, false) == 1;
}

bool ads1115_start_continuous(ads1115_t *dev, uint8_t channel) {
    static const uint16_t mux_map[4] = {
        ADS1115_MUX_AIN0_GND, ADS1115_MUX_AIN1_GND,
        ADS1115_MUX_AIN2_GND, ADS1115_MUX_AIN3_GND,
    };
    if (channel > 3u) return false;

    uint16_t config = mux_map[channel]
                    | dev->pga
                    | ADS1115_MODE_CONTINUOUS
                    | ADS1115_DR_860SPS          /* max rate; firmware decimates */
                    | ADS1115_COMP_QUE_DISABLE;

    if (!reg_write(dev, ADS1115_REG_CONFIG, config)) return false;
    return reg_select(dev, ADS1115_REG_CONVERSION);
}

int16_t ads1115_read_raw(ads1115_t *dev) {
    uint8_t data[2] = {0, 0};
    /* Address pointer already set to REG_CONVERSION by start_continuous() */
    i2c_read_blocking(dev->i2c, dev->addr, data, 2, false);
    return (int16_t)((uint16_t)(data[0] << 8) | data[1]);
}

float ads1115_raw_to_volts(const ads1115_t *dev, int16_t raw) {
    static const float fs_table[6] = {
        6.144f, 4.096f, 2.048f, 1.024f, 0.512f, 0.256f
    };
    uint8_t idx = (uint8_t)((dev->pga >> 9) & 0x07u);
    if (idx > 5u) idx = 5u;
    return (float)raw * fs_table[idx] / 32768.0f;
}
