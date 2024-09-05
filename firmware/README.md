# ESP32 WebSocket Audio Client

This firmware turns your ESP32 device into a WebSocket audio client, enabling real-time audio communication with the WS backend server hosted at `../backend`. It's designed to be used in interactive toys or devices that can create AI characters for conversation.

## Installation with PlatformIO

1. Install PlatformIO IDE (Visual Studio Code extension) if you haven't already.

2. Create a new PlatformIO project:

    - Open PlatformIO Home
    - Click "New Project"
    - Name your project (e.g., "FullDuplexWebSocketAudio")
    - Select "Espressif ESP32 Dev Module" as the board
    - Choose "Arduino" as the framework
    - Select a location for your project

3. Replace the contents of `src/main.cpp` with the provided ESP32 WebSocket Audio Client code.

4. Add the required libraries to your `platformio.ini` file:

    ```ini
    [env:esp32dev]
    platform = espressif32
    board = esp32dev
    framework = arduino
    monitor_speed = 115200
    lib_deps =
        gilmaimon/ArduinoWebsockets @ ^0.5.3
        bblanchon/ArduinoJson @ ^7.1.0
    ```

5. Update the WiFi credentials and WebSocket server details in the code:

    - Find the following lines in the code and update them with your information:
        ```cpp
        const char *ssid = "<your-wifi-name>";
        const char *password = "<your-wifi-password>";
        const char *websocket_server_host = "<192.168.1.1.your-server-host>";
        const uint16_t websocket_server_port = 443;
        const char *websocket_server_path = "/<your-server-path-here>";
        const char *auth_token = "<your-auth-token-here>"; // generate auth-token in your starmoon account
        ```

6. Build the project:

    - Click the "PlatformIO: Build" button in the PlatformIO toolbar or run the build task.

7. Upload the firmware:

    - Connect your ESP32 to your computer.
    - Click the "PlatformIO: Upload" button or run the upload task.

8. Monitor the device:
    - Open the Serial Monitor to view debug output and device status.
    - You can do this by clicking the "PlatformIO: Serial Monitor" button or running the monitor task.

## Usage

1. Power on the ESP32 device.
2. The device will automatically connect to the configured WiFi network.
3. Press the button to initiate a full-duplex WebSocket connection to the server.
4. The LED indicates the current status:

    - Off: Not connected
    - Solid On: Connected and listening on microphone
    - Pulsing: Streaming audio output (receiving from server)

5. Speak into the microphone to send audio to the server.
6. The device will play audio received from the server through the speaker.

## Features

-   Real-time audio streaming using WebSocket
-   Full-duplex I2S audio input (microphone) and I2S audio output (speaker)
-   WiFi connectivity
-   LED status indicator
-   Button interrupt for connection management

## Hardware Requirements

-   ESP32 development board
-   INMP441 MEMS microphone (I2S input)
-   MAX98357A amplifier (I2S output)
-   LED (for status indication)
-   Push button (for connection control)
-   USB Type-C or Micro USB power cable

## Pin Configuration

### I2S Input (Microphone)

-   SD: GPIO 13
-   WS: GPIO 5
-   SCK: GPIO 18

### I2S Output (Speaker)

-   WS: GPIO 32
-   BCK: GPIO 33
-   DATA: GPIO 25

### Other

-   LED: GPIO 2
-   Button: GPIO 26

## Functions

-   `micTask`: Handles audio input from the microphone
-   `buttonTask`: Manages button presses for connection control
-   `ledControlTask`: Controls the LED status indicator
-   `handleTextMessage`: Processes text messages from the server
-   `handleBinaryAudio`: Processes binary audio data from the server

## Customization

You can modify the following parameters in the code:

-   Audio sample rate (`SAMPLE_RATE`)
-   Buffer sizes (`bufferCnt`, `bufferLen`)
-   LED brightness levels (`MIN_BRIGHTNESS`, `MAX_BRIGHTNESS`)
-   Debounce time for the button (`DEBOUNCE_TIME`)

## Troubleshooting

-   If you experience connection issues, check your WiFi credentials and server details.
-   Ensure all required libraries are installed and up to date.
-   Verify that the pin configuration matches your hardware setup.

## Contributing

Feel free to submit issues or pull requests to improve this firmware.

## License

MIT
