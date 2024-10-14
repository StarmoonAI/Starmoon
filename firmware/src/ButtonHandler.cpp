#include "ButtonHandler.h"
#include "Config.h"
#include "WebSocketHandler.h"

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