#include <Arduino.h>

// Define pins - make sure these are PWM capable pins
int redPin = D7;   // Red LED pin
int greenPin = D8; // Green LED pin
int bluePin = D9;  // Blue LED pin

// Tailwind Cyan color palette
struct Color
{
    int r, g, b;
};

const Color CYAN_COLORS[] = {
    {236, 254, 255}, // cyan-50
    {207, 250, 254}, // cyan-100
    {165, 243, 252}, // cyan-200
    {103, 232, 249}, // cyan-300
    {34, 211, 238},  // cyan-400
    {6, 182, 212},   // cyan-500
    {8, 145, 178},   // cyan-600
    {14, 116, 144},  // cyan-700
    {21, 94, 117},   // cyan-800
    {22, 78, 99}     // cyan-900
};

// Function to set RGB color (for Common Anode RGB LED)
void setColor(int red, int green, int blue)
{
    // For common anode, we need to invert the values
    analogWrite(redPin, 255 - red);
    analogWrite(greenPin, 255 - green);
    analogWrite(bluePin, 255 - blue);
}

void setup()
{
    pinMode(redPin, OUTPUT);
    pinMode(greenPin, OUTPUT);
    pinMode(bluePin, OUTPUT);
}

void loop()
{
    // Loop through each Tailwind Cyan shade
    for (int i = 0; i < 10; i++)
    {
        setColor(
            CYAN_COLORS[i].r,
            CYAN_COLORS[i].g,
            CYAN_COLORS[i].b);

        // Hold each color for 2 seconds
        delay(2000);
    }

    // Optional: Add a smooth transition between shades
    for (int i = 0; i < 9; i++)
    {
        // Create 50 steps between each shade
        for (int step = 0; step < 50; step++)
        {
            float ratio = step / 50.0;

            int r = CYAN_COLORS[i].r + (CYAN_COLORS[i + 1].r - CYAN_COLORS[i].r) * ratio;
            int g = CYAN_COLORS[i].g + (CYAN_COLORS[i + 1].g - CYAN_COLORS[i].g) * ratio;
            int b = CYAN_COLORS[i].b + (CYAN_COLORS[i + 1].b - CYAN_COLORS[i].b) * ratio;

            setColor(r, g, b);
            delay(20); // 20ms between each step makes a 1-second transition
        }
    }
}