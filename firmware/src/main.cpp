#include <Arduino.h>
// #include <stdint.h>
#include "config.h"
#include "WiFiSetup.h"
#include "WebSocketHandler.h"
#include "I2SHandler.h"

bool lastButtonState = HIGH; // Initialize to HIGH (button not pressed)

void buttonTask(void *parameter)
{
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    lastButtonState = digitalRead(BUTTON_PIN);

    while (1)
    {
        int buttonState = digitalRead(BUTTON_PIN);

        if (buttonState == LOW && lastButtonState == HIGH)
        {
            vTaskDelay(50);
            buttonState = digitalRead(BUTTON_PIN);

            if (buttonState == LOW)
            {
                if (isWebSocketConnected)
                {
                    client.close();
                    Serial.println("WebSocket disconnected.");
                }
                else
                {
                    connectWSServer();
                    Serial.println("WebSocket connected and micTask started.");
                }
            }
        }

        // ets_printf("Never Used Stack Size: %u\n", uxTaskGetStackHighWaterMark(NULL));

        // Update the last button state
        lastButtonState = buttonState;
        vTaskDelay(50);
    }
}

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