#include <driver/i2s.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <freertos/queue.h>

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

#define BUTTON_PIN 0
#define LED_PIN 2

// I2S pins for Audio Input (INMP441 MEMS microphone)
#define I2S_SD 19
#define I2S_WS 5
#define I2S_SCK 18
#define I2S_PORT I2S_NUM_0

#define SAMPLE_RATE 16000
#define bufferCnt 10
#define bufferLen 1024
int16_t sBuffer[bufferLen];

#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define BUFFER_SIZE 1024
int16_t audioBuffer[BUFFER_SIZE];

// Flags to control audio mode
enum AudioMode
{
    MODE_IDLE,
    MODE_RECORDING,
    MODE_PLAYING
};
volatile AudioMode currentMode = MODE_IDLE;

// WiFi credentials
const char *ssid = "launchlab";
const char *password = "LaunchLabRocks";

// WebSocket server details
const char *websocket_server_host = "192.168.2.236";
const uint16_t websocket_server_port = 8000;
const char *websocket_server_path = "/starmoon";
const char *auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bnJ1eGlvbmdAZ21haWwuY29tIiwidXNlcl9pZCI6IjAwNzljZWU5LTE4MjAtNDQ1Ni05MGE0LWU4YzI1MzcyZmUyOSIsImNyZWF0ZWRfdGltZSI6IjIwMjQtMDktMDZUMTY6NDU6MzQuMDQyMTU5In0.D7zgHF5qS1HiH4tRZ4XBpvd5_O-pjjg-tEngJt51MW4";
String authMessage;

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
    currentMode = MODE_RECORDING;
    authMessage = createAuthTokenMessage(auth_token);
    Serial.println(authMessage);
    client.send(authMessage);
    Serial.println("Connnection Opened");
    analogWrite(LED_PIN, 250);
    isWebSocketConnected = true;
}

void onWSConnectionClosed()
{
    currentMode = MODE_IDLE;
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
        .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = bufferCnt,
        .dma_buf_len = bufferLen,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0};

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    Serial.printf("I2S mic driver install: %s\n", esp_err_to_name(err));
}

void i2s_setpin()
{
    // Set I2S pin configuration
    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = I2S_SD,
        .data_in_num = I2S_SD};

    i2s_set_pin(I2S_PORT, &pin_config);
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

void audioTask(void *parameter)
{
    size_t bytesRead = 0;
    size_t bytesWritten = 0;

    while (1)
    {
        if (isWebSocketConnected)
        {
            switch (currentMode)
            {
            case MODE_RECORDING:
                esp_err_t result = i2s_read(I2S_PORT, &sBuffer, bufferLen, &bytesRead, portMAX_DELAY);
                if (result == ESP_OK)
                {
                    client.sendBinary((const char *)sBuffer, bytesRead);
                }
                else
                {
                    Serial.printf("Error reading from I2S: %d\n", result);
                }

                break;
            }
        }
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
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
        currentMode = MODE_PLAYING;
    }
    else if (strcmp(type, "end_of_audio") == 0)
    {
        Serial.println("Received end_of_audio");
        currentMode = MODE_RECORDING;
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
    if (currentMode == MODE_PLAYING)
    {
        size_t bytesWritten = 0;
        esp_err_t result = i2s_write(I2S_PORT, payload, length, &bytesWritten, portMAX_DELAY);
        if (result != ESP_OK)
        {
            Serial.printf("Error in i2s_write: %d\n", result);
        }
    }
}

void onMessageCallback(WebsocketsMessage message)
{
    if (message.isText())
    {
        handleTextMessage(message.c_str());
    }
    else if (message.isBinary() && currentMode == MODE_PLAYING)
    {
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
                if (currentMode == MODE_RECORDING)
                {
                    disconnectWSServer();
                    Serial.println("Stopping recording");
                }
                else if (currentMode == MODE_PLAYING)
                {
                    currentMode = MODE_RECORDING;
                    Serial.println("Starting recording");
                }
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
        else if (currentMode == MODE_PLAYING)
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

    connectWiFi();
    client.onEvent(onEventsCallback);
    client.onMessage(onMessageCallback);

    i2s_install();
    i2s_setpin();

    xTaskCreatePinnedToCore(audioTask, "micTask", 10000, NULL, 1, &micTaskHandle, 0);
    xTaskCreatePinnedToCore(ledControlTask, "ledControlTask", 2048, NULL, 1, &ledTaskHandle, 1);
    xTaskCreate(buttonTask, "buttonTask", 2048, NULL, 1, &buttonTaskHandle);

    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);

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
