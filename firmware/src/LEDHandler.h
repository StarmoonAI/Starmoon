#ifndef LEDHANDLER_H
#define LEDHANDLER_H

#include "Config.h"

enum DeviceState
{
    STATE_SETUP,                // when AP mode is enabled
    STATE_CONNECTING,           // trying to connect WiFi / AP mode
    STATE_RESPONDING,           // actively responding
    STATE_LISTENING,            // listening on websocket
    STATE_WAITING_FOR_RESPONSE, // TODO: after sending a message, waiting
    STATE_ERROR,                // error state
    STATE_OTAING,               // TODO: OTA update in progress
    STATE_LONG_PRESS_END,       // TODO: user holding main button to end websocket
    STATE_FACTORY_RESET,        // TODO: user holding boot button to factory reset
};

extern DeviceState deviceState;

void setLEDColor(uint8_t r, uint8_t g, uint8_t b);
void turnOffLED();
void turnOnLED();
void setupRGBLED();
void turnOnBlueLED();
void turnOnRedLEDFlash();
void ledTask(void *parameter);

// void ledTask(void *parameter);
#endif