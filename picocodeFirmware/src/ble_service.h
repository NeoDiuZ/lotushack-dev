/*
 * ble_service.h
 * BLE GATT peripheral.
 *
 * Sends "S:<gamma>,<beta>,<alpha>,<theta>,<delta>,<focus_pct>" ONLY when
 * the attention state changes (H→U→F transitions).
 * This matches the existing FocusIQ.jsx parser exactly.
 *
 * Service UUID:  6910123a-eb0d-4c35-9a60-bebe1dcb549d
 * Data char:     5f4f1107-7fc1-43b2-a540-0aa1a9f1ce78  NOTIFY
 * Control char:  5f4f1107-7fc1-43b2-a540-0aa1a9f1ce79  WRITE
 *
 * Incoming control bytes (browser → firmware):
 *   0x01  Start streaming
 *   0x02  Stop streaming
 *   0x03  Buzzer ON
 *   0x04  Buzzer OFF
 */
#pragma once

#include "attention_states.h"
#include <stdint.h>
#include <stdbool.h>

#define BLE_DEVICE_NAME       "FocusIQ"

#define BLE_CMD_START_STREAM  0x01
#define BLE_CMD_STOP_STREAM   0x02
#define BLE_CMD_BUZZER_ON     0x03
#define BLE_CMD_BUZZER_OFF    0x04

typedef void (*ble_cmd_callback_t)(uint8_t cmd);

void ble_service_init(ble_cmd_callback_t cmd_cb);
void ble_service_start_advertising(void);
bool ble_service_is_connected(void);

/* Call this when state changes. Sends the full S: packet the website
 * parses. Only transmits if connected and notifications are enabled.  */
bool ble_service_notify_attention(const attention_data_t *data);
