/*
 * ble_service.c
 * BTstack BLE GATT peripheral.
 * Sends S: packet only when attention state changes.
 */
#include "ble_service.h"
#include "focusiq.h"        /* generated from focusiq.gatt by CMake */
#include "btstack.h"
#include "pico/cyw43_arch.h"
#include <stdio.h>
#include <string.h>

/* ── Handle aliases ──────────────────────────────────────────────────── */
#define HANDLE_DATA_VALUE  \
    ATT_CHARACTERISTIC_5f4f1107_7fc1_43b2_a540_0aa1a9f1ce78_01_VALUE_HANDLE
#define HANDLE_DATA_CCC    \
    ATT_CHARACTERISTIC_5f4f1107_7fc1_43b2_a540_0aa1a9f1ce78_01_CLIENT_CONFIGURATION_HANDLE
#define HANDLE_CTRL_VALUE  \
    ATT_CHARACTERISTIC_5f4f1107_7fc1_43b2_a540_0aa1a9f1ce79_01_VALUE_HANDLE

/* ── State ───────────────────────────────────────────────────────────── */
static btstack_packet_callback_registration_t s_hci_cb_reg;
static hci_con_handle_t   s_con_handle     = HCI_CON_HANDLE_INVALID;
static bool               s_notify_enabled = false;
static bool               s_streaming      = true;
static ble_cmd_callback_t s_cmd_cb         = NULL;

/* Advertising data (service UUID in little-endian) */
static const uint8_t s_adv_data[] = {
    0x02, BLUETOOTH_DATA_TYPE_FLAGS, 0x06,
    0x08, BLUETOOTH_DATA_TYPE_COMPLETE_LOCAL_NAME,
          'F','o','c','u','s','I','Q',
    0x11, BLUETOOTH_DATA_TYPE_INCOMPLETE_LIST_OF_128_BIT_SERVICE_CLASS_UUIDS,
          0x9d,0x54,0xcb,0x1d,0xbe,0xbe,0x60,0x9a,
          0x35,0x4c,0x0d,0xeb,0x3a,0x12,0x10,0x69
};

/* ── ATT read ────────────────────────────────────────────────────────── */
static uint16_t att_read_cb(hci_con_handle_t conn, uint16_t handle,
                             uint16_t offset, uint8_t *buf, uint16_t buf_size) {
    (void)conn; (void)offset; (void)buf_size;
    if (handle == HANDLE_DATA_VALUE) { if (buf) buf[0] = 0; return 1; }
    return 0;
}

/* ── ATT write ───────────────────────────────────────────────────────── */
static int att_write_cb(hci_con_handle_t conn, uint16_t handle,
                         uint16_t tx_mode, uint16_t offset,
                         uint8_t *buf, uint16_t buf_size) {
    (void)conn; (void)tx_mode; (void)offset;

    if (handle == HANDLE_DATA_CCC) {
        s_notify_enabled = (buf_size >= 1) && ((buf[0] & 0x01u) != 0u);
        printf("[BLE] notify %s\n", s_notify_enabled ? "ON" : "OFF");
        return 0;
    }
    if (handle == HANDLE_CTRL_VALUE && buf_size >= 1u) {
        if      (buf[0] == BLE_CMD_START_STREAM) { s_streaming = true;  return 0; }
        else if (buf[0] == BLE_CMD_STOP_STREAM)  { s_streaming = false; return 0; }
        else if (s_cmd_cb) s_cmd_cb(buf[0]);
    }
    return 0;
}

/* ── HCI packet handler ──────────────────────────────────────────────── */
static void packet_handler(uint8_t pkt_type, uint16_t channel,
                            uint8_t *pkt, uint16_t size) {
    (void)channel; (void)size;
    if (pkt_type != HCI_EVENT_PACKET) return;

    switch (hci_event_packet_get_type(pkt)) {
    case BTSTACK_EVENT_STATE:
        if (btstack_event_state_get_state(pkt) == HCI_STATE_WORKING)
            ble_service_start_advertising();
        break;
    case HCI_EVENT_LE_META:
        if (hci_event_le_meta_get_subevent_code(pkt) ==
            HCI_SUBEVENT_LE_CONNECTION_COMPLETE) {
            s_con_handle =
                hci_subevent_le_connection_complete_get_connection_handle(pkt);
            printf("[BLE] connected\n");
        }
        break;
    case HCI_EVENT_DISCONNECTION_COMPLETE:
        printf("[BLE] disconnected\n");
        s_con_handle     = HCI_CON_HANDLE_INVALID;
        s_notify_enabled = false;
        ble_service_start_advertising();
        break;
    default: break;
    }
}

/* ── Public API ──────────────────────────────────────────────────────── */

void ble_service_init(ble_cmd_callback_t cmd_cb) {
    s_cmd_cb = cmd_cb;
    l2cap_init();
    sm_init();
    sm_set_io_capabilities(IO_CAPABILITY_NO_INPUT_NO_OUTPUT);
    sm_set_authentication_requirements(0);
    att_server_init(profile_data, att_read_cb, att_write_cb);
    s_hci_cb_reg.callback = &packet_handler;
    hci_add_event_handler(&s_hci_cb_reg);
    att_server_register_packet_handler(&packet_handler);
}

void ble_service_start_advertising(void) {
    uint16_t adv_int = 160u;
    bd_addr_t null_addr = {0};
    gap_advertisements_set_params(adv_int, adv_int, ADV_IND, 0, null_addr, 0x07, 0x00);
    gap_advertisements_set_data(sizeof(s_adv_data), (uint8_t *)s_adv_data);
    gap_advertisements_enable(1);
}

bool ble_service_is_connected(void) {
    return s_con_handle != HCI_CON_HANDLE_INVALID;
}

bool ble_service_notify_attention(const attention_data_t *data) {
    if (s_con_handle == HCI_CON_HANDLE_INVALID) return false;
    if (!s_notify_enabled || !s_streaming)      return false;

    /*
     * Packet format matches FocusIQ.jsx parser exactly:
     *   "S:<gamma>,<beta>,<alpha>,<theta>,<delta>,<focus_pct>"
     *
     * focus_pct drives the website's rolling-average state classification:
     *   H (High Focus)  → focus_pct >= 25  → website sets brainState "focused"
     *   U (Unfocus)     → focus_pct 13–24  → website sets brainState "unfocused"
     *   F (Fatigued)    → focus_pct < 13   → website sets brainState "fatigued"
     */
    char pkt[64];
    int len = snprintf(pkt, sizeof(pkt), "S:%u,%u,%u,%u,%u,%u",
                       (unsigned)data->band_power[BAND_GAMMA],
                       (unsigned)data->band_power[BAND_BETA],
                       (unsigned)data->band_power[BAND_ALPHA],
                       (unsigned)data->band_power[BAND_THETA],
                       (unsigned)data->band_power[BAND_DELTA],
                       (unsigned)data->focus_pct);

    if (len <= 0 || len >= (int)sizeof(pkt)) return false;

    printf("[BLE] state=%s  pkt=%s\n",
           data->state == ATTENTION_HIGH_FOCUS ? "H" :
           data->state == ATTENTION_UNFOCUS    ? "U" : "F",
           pkt);

    return att_server_notify(s_con_handle, HANDLE_DATA_VALUE,
                             (uint8_t *)pkt, (uint16_t)len)
           == ERROR_CODE_SUCCESS;
}
