#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

// define preferences
extern Preferences preferences;

// OTA status
extern bool ota_status;

// WiFi credentials
extern const char *EAP_IDENTITY;
extern const char *EAP_USERNAME;
extern const char *EAP_PASSWORD;

extern WebSocketsClient webSocket;

extern const char *ssid_peronal;
extern const char *password_personal;

// WebSocket server details
extern const char *backend_server;
extern const uint16_t backend_port;
extern const char *websocket_path;

// auth credentials
extern String authTokenGlobal;
extern const char *auth_token;

// I2S and Audio parameters
extern const uint32_t SAMPLE_RATE;
extern const int bufferCnt;
extern const int bufferLen;
extern const int I2S_READ_LEN;
extern int16_t sBuffer[];

// ----------------- Pin Definitions -----------------
// Define which board you are using (uncomment one)
// #define USE_NORMAL_ESP32_S3
#define USE_XIAO_ESP32_DEVKIT
// #define USE_XIAO_ESP32
// #define USE_NORMAL_ESP32
// #define USE_ESP32_S3_WHITE_CASE

extern const gpio_num_t BUTTON_PIN;

// LED pins
extern const int RED_LED_PIN;
extern const int GREEN_LED_PIN;
extern const int BLUE_LED_PIN;

// I2S Microphone pins
extern const int I2S_SD;
extern const int I2S_WS;
extern const int I2S_SCK;
extern const i2s_port_t I2S_PORT_IN;

// I2S Speaker pins
extern const int I2S_WS_OUT;
extern const int I2S_BCK_OUT;
extern const int I2S_DATA_OUT;
extern const i2s_port_t I2S_PORT_OUT;
extern const int I2S_SD_OUT;

// SSL certificate
extern const char *rootCACertificate;
void clearNVS();
void goToSleep();

#endif