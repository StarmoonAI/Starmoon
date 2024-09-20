#include <Arduino.h>

#define LED_PIN D7 // GPIO pin connected to the LED

// Different PWM values can result in different colors or modes
const int RED_VALUE = 64;
const int GREEN_VALUE = 128;
const int BLUE_VALUE = 192;

void setup()
{
    // Configure LED_PIN for PWM
    ledcSetup(0, 5000, 8);     // Channel 0, 5000 Hz, 8-bit resolution
    ledcAttachPin(LED_PIN, 0); // Attach the LED pin to channel 0
}

void loop()
{
    // Cycle through colors
    ledcWrite(0, RED_VALUE);
    delay(200); // Wait for 2 seconds

    ledcWrite(0, GREEN_VALUE);
    delay(200);

    ledcWrite(0, BLUE_VALUE);
    delay(200);
}