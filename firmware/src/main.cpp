#include <Arduino.h>
// #include <stdint.h>
#include "config.h"
#include "WiFiSetup.h"
#include "WebSocketHandler.h"
#include "I2SHandler.h"
#include "ButtonHandler.h"

void printLocalTime()
{
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo))
    {
        Serial.println("Failed to obtain time");
        return;
    }
    Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
}

void setup()
{
    Serial.begin(115200);
    connectWiFi();
    // connectWSServer();
    i2s_install_speaker();
    i2s_setpin_speaker();
    // delay(50);

    // client.setInsecure();
    // client.setCACert(rootCACertificate);

    xTaskCreate(buttonTask, "Button Task", 2048, NULL, 1, NULL);
    xTaskCreate(micTask, "Microphone Task", 2048, NULL, 1, NULL);
}

void loop()
{
    if (isWebSocketConnected)
    {
        client.poll();
    }
}