/*
 * btstack_config.h
 * BTstack compile-time configuration for FocusIQ on Pico W.
 * Must be on the compiler include path before any BTstack header.
 */
#pragma once

/* Core BLE support – LE peripheral only (no classic BT, no WiFi) */
#define ENABLE_BLE
#define ENABLE_LE_PERIPHERAL

/* ATT / GATT server */
#define ATT_DEFAULT_MTU              64
#define MAX_ATT_DB_SIZE             512

/* Security Manager – no pairing required for open prototype connection */
#define SM_MAX_NR_CONNECTIONS         1

/* HCI buffers */
#define HCI_ACL_PAYLOAD_SIZE         (255 + 4)
#define HCI_INCOMING_PRE_BUFFER_SIZE  14

/* Limits */
#define MAX_NR_HCI_CONNECTIONS        1
#define MAX_NR_SM_LOOKUP_ENTRIES      3
#define MAX_NR_WHITELIST_ENTRIES      4
#define MAX_NR_LE_DEVICE_DB_ENTRIES   4
#define MAX_NR_GATT_CLIENTS           0
#define NVM_NUM_DEVICE_DB_ENTRIES     0   /* no bonding stored */

/* Uncomment for verbose BLE logs over USB serial */
/* #define ENABLE_LOG_INFO  */
/* #define ENABLE_LOG_DEBUG */
