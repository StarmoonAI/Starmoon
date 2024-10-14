#ifndef CONFIG_H
#define CONFIG_H

#include <driver/i2s.h>

// WiFi credentials
extern const char *EAP_IDENTITY;
extern const char *EAP_USERNAME;
extern const char *EAP_PASSWORD;
extern const char *ssid;

extern const char *ssid_peronal;
extern const char *password_personal;

// WebSocket server details
extern const char *websocket_server;
extern const uint16_t websocket_port;
extern const char *websocket_path;
extern const char *auth_token;

// I2S and Audio parameters
extern const uint32_t SAMPLE_RATE;
extern const int bufferCnt;
extern const int bufferLen;
extern const int I2S_READ_LEN;
extern int16_t sBuffer[];

// ----------------- Pin Definitions -----------------
// Define which board you are using (uncomment one)
#define USE_XIAO_ESP32
// #define USE_NORMAL_ESP32

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

// Button pin
extern const int BUTTON_PIN;

// SSL certificate
extern const char *rootCACertificate;

#endif