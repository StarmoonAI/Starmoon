#include <driver/i2s.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <freertos/queue.h>
#include <WiFiManager.h> // Include the WiFiManager library

// Debounce time in milliseconds
#define DEBOUNCE_TIME 50

// Task handles
TaskHandle_t micTaskHandle = NULL;
TaskHandle_t buttonTaskHandle = NULL;
TaskHandle_t ledTaskHandle = NULL;

// BUTTON variables
unsigned long lastDebounceTime = 0;
bool isWebSocketConnected = false;
bool shouldConnectWebSocket = false;
volatile bool buttonPressed = false;

// LED variables
#define MIN_BRIGHTNESS 1
#define MAX_BRIGHTNESS 200
unsigned long lastPulseTime = 0;
int ledBrightness = 0;
int fadeAmount = 5;

#define BUTTON_PIN D5       // Built-in BOOT button (GPIO 0)
#define LED_PIN LED_BUILTIN // Built-in LED (GPIO 10)

// I2S pins for Audio Input (INMP441 MEMS microphone)
#define I2S_SD D9
#define I2S_WS D7
#define I2S_SCK D8
#define I2S_PORT_IN I2S_NUM_0

// I2S pins for Audio Output (MAX98357A amplifier)
#define I2S_WS_OUT D0
#define I2S_BCK_OUT D1
#define I2S_DATA_OUT D2
#define I2S_PORT_OUT I2S_NUM_1
#define I2S_SD_OUT D3

#define SAMPLE_RATE 16000
#define bufferCnt 10
#define bufferLen 1024
int16_t sBuffer[bufferLen];

#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define BUFFER_SIZE 1024

// // Wifi Credentials
String ssid = "launchlab";
String password = "LaunchLabRocks";

WiFiManager wm;

void simpleSetup()
{
    // **Set the portal title to "Starmoon AI"**
    wm.setTitle("Starmoon AI");

    // Set the menu to only include "Configure WiFi"
    std::vector<const char *> menu = {"wifi"};
    wm.setMenu(menu);

    // **Inject custom CSS to hide unwanted elements**
    String customHead = "<title>Starmoon setup</title>"
                        "<style>"
                        "  .msg { display: none; }" /* Hide the "No AP set" message */
                        "  h2 { display: none; }"   /* Hide default heading "WiFiManager" */
                        "</style>";
    wm.setCustomHeadElement(customHead.c_str());

    // **Inject custom HTML into the page body**
    String customHTML = "<h1 style='text-align:center;'>Starmoon AI</h1>";
    wm.setCustomMenuHTML(customHTML.c_str());

    // Start the configuration portal
    bool res = wm.startConfigPortal("Starmoon device");

    if (res)
    {
        Serial.println("Connected to Wi-Fi!");
        Serial.println("IP address: ");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.println("Failed to connect to Wi-Fi");
        ESP.restart(); // Optionally restart or handle the failure
    }
}

// WebSocket server details
// const char *websocket_server_host = "192.168.2.236";
const char *websocket_server_host = "172.18.80.69";
const uint16_t websocket_server_port = 8000;
const char *websocket_server_path = "/starmoon";
const char *auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNWFmNjJiMGUtM2RhNC00YzQ0LWFkZjctNWIxYjdjOWM0Y2I2IiwiZW1haWwiOiJhZG1pbkBzdGFybW9vbi5hcHAiLCJpYXQiOjE3MjYyMzY1Njl9.5Ble6393MS2yPPzxlONh2GGP1aI5v1R6TjLPWQ1eHY0";
String authMessage;

// Flag to control when to play audio
bool shouldPlayAudio = false;

// ISR to handle button press
void IRAM_ATTR buttonISR()
{
    buttonPressed = true;
}

// Function to create JSON message with the authentication token
String createAuthTokenMessage(const char *token)
{
    JsonDocument doc;
    doc["token"] = token;
    doc["device"] = "esp";
    doc["user_id"] = NULL;
    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

using namespace websockets;
WebsocketsClient client;

// Function prototypes
void onWSConnectionOpened();
void onWSConnectionClosed();
void onEventsCallback(WebsocketsEvent event, String data);
void sendAcknowledgment();
void i2s_install();
void i2s_setpin();
void i2s_speaker_install();
void i2s_speaker_setpin();
void connectWiFi();
void startSpeaker();
void stopSpeaker();
void handleTextMessage(const char *msgText);
void connectWSServer();
void disconnectWSServer();
void handleBinaryAudio(const char *payload, size_t length);
void onMessageCallback(WebsocketsMessage message);
void micTask(void *parameter);
void buttonTask(void *parameter);
void ledControlTask(void *parameter);

void onWSConnectionOpened()
{
    authMessage = createAuthTokenMessage(auth_token);
    Serial.println(authMessage);
    client.send(authMessage);
    Serial.println("Connnection Opened");
    analogWrite(LED_PIN, 250);
    isWebSocketConnected = true;
}

void onWSConnectionClosed()
{
    analogWrite(LED_PIN, 0);
    Serial.println("Connnection Closed");
    isWebSocketConnected = false;
}

void onEventsCallback(WebsocketsEvent event, String data)
{
    if (event == WebsocketsEvent::ConnectionOpened)
    {
        onWSConnectionOpened();
    }
    else if (event == WebsocketsEvent::ConnectionClosed)
    {
        onWSConnectionClosed();
    }
    else if (event == WebsocketsEvent::GotPing)
    {
        Serial.println("Got a Ping!");
    }
    else if (event == WebsocketsEvent::GotPong)
    {
        Serial.println("Got a Pong!");
    }
}

void sendAcknowledgment()
{
    JsonDocument doc;
    doc["speaker"] = "user";
    doc["is_replying"] = false;
    String response;
    serializeJson(doc, response);
    client.send(response);
}

void i2s_install()
{
    // Set up I2S Processor configuration
    const i2s_config_t i2s_config = {
        .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
        .intr_alloc_flags = 0,
        .dma_buf_count = bufferCnt,
        .dma_buf_len = bufferLen,
        .use_apll = false};

    esp_err_t err = i2s_driver_install(I2S_PORT_IN, &i2s_config, 0, NULL);
    Serial.printf("I2S mic driver install: %s\n", esp_err_to_name(err));
}

void i2s_setpin()
{
    // Set I2S pin configuration
    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = -1,
        .data_in_num = I2S_SD};

    i2s_set_pin(I2S_PORT_IN, &pin_config);
}

void i2s_speaker_install()
{
    // Set up I2S Processor configuration for speaker
    const i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, // Mono audio
        .communication_format = I2S_COMM_FORMAT_I2S_MSB,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0};

    esp_err_t err = i2s_driver_install(I2S_PORT_OUT, &i2s_config, 0, NULL); // Install the I2S driver on I2S_NUM_1
    Serial.printf("I2S speaker driver install: %s\n", esp_err_to_name(err));
}

void i2s_speaker_setpin()
{
    // Set I2S pin configuration for speaker
    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCK_OUT,    // Bit Clock (BCK)
        .ws_io_num = I2S_WS_OUT,      // Word Select (LRCK)
        .data_out_num = I2S_DATA_OUT, // Data Out (DIN)
        .data_in_num = -1};           // Not used, so set to -1

    i2s_set_pin(I2S_PORT_OUT, &pin_config); // Set the I2S pins on I2S_NUM_1
}

void connectWiFi()
{
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("");
    Serial.println("WiFi connected");

    WiFi.setSleep(false);
}

void micTask(void *parameter)
{
    i2s_start(I2S_PORT_IN);

    size_t bytesIn = 0;
    Serial.println("Mic task started");

    while (1)
    {
        // Check if the WebSocket connection is still active
        if (isWebSocketConnected)
        {
            esp_err_t result = i2s_read(I2S_PORT_IN, &sBuffer, bufferLen, &bytesIn, portMAX_DELAY);
            if (result == ESP_OK)
            {
                // time sending audio data
                unsigned long currentMillis = millis();
                Serial.printf("Sending audio at %lu\n", currentMillis);

                client.sendBinary((const char *)sBuffer, bytesIn);
            }
            else
            {
                Serial.printf("Error reading from I2S: %d\n", result);
            }
        }

        // Add a small delay to prevent watchdog issues
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }

    // If the task is ending, ensure I2S is stopped and buffer is cleared
    i2s_stop(I2S_PORT_IN);
    i2s_zero_dma_buffer(I2S_PORT_IN);
    Serial.println("Mic task ended");
    vTaskDelete(NULL); // Delete the task if it's no longer needed
}

void startSpeaker()
{
    shouldPlayAudio = true;

    // Start the I2S interface when the audio stream starts
    esp_err_t err = i2s_start(I2S_PORT_OUT);
    if (err != ESP_OK)
    {
        Serial.printf("Failed to start I2S: %d\n", err);
    }
    else
    {
        Serial.println("I2S started");
    }
}

void stopSpeaker()
{
    shouldPlayAudio = false;

    // Stop the I2S interface when the audio stream ends
    esp_err_t err = i2s_stop(I2S_PORT_OUT);

    if (err != ESP_OK)
    {
        Serial.printf("Failed to stop I2S: %d\n", err);
    }
    else
    {
        Serial.println("I2S stopped");
    }
    i2s_zero_dma_buffer(I2S_PORT_OUT);
}

void handleTextMessage(const char *msgText)
{
    Serial.printf("Received message: %s\n", msgText);

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, msgText);

    if (error)
    {
        Serial.println("Failed to parse JSON");
        return;
    }

    const char *type = doc["type"];
    if (strcmp(type, "start_of_audio") == 0)
    {
        Serial.println("Received start_of_audio");
        startSpeaker();
    }
    else if (strcmp(type, "end_of_audio") == 0)
    {
        Serial.println("Received end_of_audio");

        // Clear any remaining buffers or resources here if necessary
        stopSpeaker();

        // Send acknowledgment to the server
        sendAcknowledgment();
    }
}

void connectWSServer()
{
    if (client.connect(websocket_server_host, websocket_server_port, websocket_server_path))
    {
        Serial.println("Connected to WebSocket server");
    }
    else
    {
        Serial.println("Failed to connect to WebSocket server");
    }
}

void disconnectWSServer()
{
    client.close();
    vTaskDelay(100 / portTICK_PERIOD_MS); // Delay to ensure the connection is closed
    onWSConnectionClosed();
}

void handleBinaryAudio(const char *payload, size_t length)
{
    size_t bytesWritten = 0;

    // time received audio
    unsigned long currentMillis = millis();
    Serial.printf("Received audio at %lu\n", currentMillis);

    esp_err_t result = i2s_write(I2S_PORT_OUT, payload, length, &bytesWritten, portMAX_DELAY);
    if (result != ESP_OK)
    {
        Serial.printf("Error in i2s_write: %d\n", result);
    }
    else if (bytesWritten != length)
    {
        Serial.printf("Warning: only %d bytes written out of %d\n", bytesWritten, length);
    }
}

void onMessageCallback(WebsocketsMessage message)
{
    if (message.isText())
    {
        handleTextMessage(message.c_str());
    }
    else if (message.isBinary() && shouldPlayAudio)
    {
        // Handle binary audio data
        handleBinaryAudio(message.c_str(), message.length());
    }
}

void buttonTask(void *parameter)
{
    while (1)
    {
        if (buttonPressed && (millis() - lastDebounceTime > DEBOUNCE_TIME))
        {
            buttonPressed = false;
            lastDebounceTime = millis();

            Serial.println("Button pressed");
            Serial.printf("isWebSocketConnected: %d\n", isWebSocketConnected);

            if (isWebSocketConnected)
            {
                disconnectWSServer();
            }
            else
            {
                Serial.println("Attempting to connect to WebSocket server...");
                shouldConnectWebSocket = true;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10)); // Small delay to prevent task starvation
    }
}

void ledControlTask(void *parameter)
{
    unsigned long lastPulseTime = 0;
    int ledBrightness = MIN_BRIGHTNESS;
    int fadeAmount = 5;

    while (1)
    {
        if (!isWebSocketConnected)
        {
            analogWrite(LED_PIN, 0); // LED off when not connected
        }
        else if (shouldPlayAudio)
        {
            // Pulse LED while playing audio
            unsigned long currentMillis = millis();
            if (currentMillis - lastPulseTime >= 30)
            {
                lastPulseTime = currentMillis;

                ledBrightness += fadeAmount;
                if (ledBrightness <= MIN_BRIGHTNESS || ledBrightness >= MAX_BRIGHTNESS)
                {
                    fadeAmount = -fadeAmount;
                }

                analogWrite(LED_PIN, ledBrightness);
            }
        }
        else
        {
            // Fixed brightness when connected but not playing audio
            analogWrite(LED_PIN, MAX_BRIGHTNESS);
        }

        // Small delay to prevent task from hogging CPU
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

void setup()
{
    Serial.begin(115200);

    // connectWiFi();
    simpleSetup();
    client.onEvent(onEventsCallback);
    client.onMessage(onMessageCallback);

    i2s_install();
    i2s_setpin();

    i2s_speaker_install();
    i2s_speaker_setpin();

    xTaskCreatePinnedToCore(micTask, "micTask", 10000, NULL, 1, &micTaskHandle, 0);
    xTaskCreatePinnedToCore(ledControlTask, "ledControlTask", 2048, NULL, 1, &ledTaskHandle, 1);
    xTaskCreate(buttonTask, "buttonTask", 2048, NULL, 1, &buttonTaskHandle);

    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);

    // Set SD_PIN as output and initialize to HIGH (unmuted)
    pinMode(I2S_SD_OUT, OUTPUT);
    digitalWrite(I2S_SD_OUT, HIGH);

    attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, FALLING);
}

void loop()
{
    if (shouldConnectWebSocket && !isWebSocketConnected)
    {
        connectWSServer();
        shouldConnectWebSocket = false;
    }

    if (client.available())
    {
        client.poll();
    }

    // Delay to avoid watchdog issues
    delay(10);
}
