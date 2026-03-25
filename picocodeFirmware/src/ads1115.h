/*
 * ads1115.h
 * Driver for the ADS1115 16-bit I2C ADC.
 * Supports continuous single-ended conversion on any of the 4 channels.
 */
#pragma once

#include "hardware/i2c.h"
#include <stdint.h>
#include <stdbool.h>

/* ── Hardware assignment ──────────────────────────────────────────────── */
#define ADS1115_I2C         i2c0
#define ADS1115_SDA_PIN     4        /* GP4  */
#define ADS1115_SCL_PIN     5        /* GP5  */
#define ADS1115_I2C_BAUD    400000   /* 400 kHz fast-mode */
#define ADS1115_ADDR        0x48     /* ADDR pin → GND    */

/* ── Register addresses ──────────────────────────────────────────────── */
#define ADS1115_REG_CONVERSION  0x00
#define ADS1115_REG_CONFIG      0x01

/* ── Config register field masks ─────────────────────────────────────── */
#define ADS1115_MUX_AIN0_GND    (4u << 12)
#define ADS1115_MUX_AIN1_GND    (5u << 12)
#define ADS1115_MUX_AIN2_GND    (6u << 12)
#define ADS1115_MUX_AIN3_GND    (7u << 12)

#define ADS1115_PGA_6144MV      (0u << 9)
#define ADS1115_PGA_4096MV      (1u << 9)
#define ADS1115_PGA_2048MV      (2u << 9)   /* ±2.048 V default */
#define ADS1115_PGA_1024MV      (3u << 9)
#define ADS1115_PGA_512MV       (4u << 9)
#define ADS1115_PGA_256MV       (5u << 9)

#define ADS1115_MODE_CONTINUOUS (0u << 8)
#define ADS1115_MODE_SINGLESHOT (1u << 8)

#define ADS1115_DR_8SPS         (0u << 5)
#define ADS1115_DR_16SPS        (1u << 5)
#define ADS1115_DR_32SPS        (2u << 5)
#define ADS1115_DR_64SPS        (3u << 5)
#define ADS1115_DR_128SPS       (4u << 5)
#define ADS1115_DR_250SPS       (5u << 5)
#define ADS1115_DR_475SPS       (6u << 5)
#define ADS1115_DR_860SPS       (7u << 5)   /* maximum rate */

#define ADS1115_COMP_QUE_DISABLE 0x0003u    /* disable ALERT/RDY pin */

/* ── Device handle ───────────────────────────────────────────────────── */
typedef struct {
    i2c_inst_t *i2c;
    uint8_t     addr;
    uint16_t    pga;   /* active PGA bits, used for volts conversion */
} ads1115_t;

/* ── Public API ──────────────────────────────────────────────────────── */
bool    ads1115_init(ads1115_t *dev);
bool    ads1115_start_continuous(ads1115_t *dev, uint8_t channel);
int16_t ads1115_read_raw(ads1115_t *dev);
float   ads1115_raw_to_volts(const ads1115_t *dev, int16_t raw);
