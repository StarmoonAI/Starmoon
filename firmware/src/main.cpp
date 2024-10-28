

#include <Arduino.h>
#include "WiFiSetup.h"
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/i2s.h>
#include <driver/rtc_io.h>

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 50;
const uint32_t connectTimeoutMs = 10000;

#define DEEP_SLEEP_EXT0
#define BUTTON_GPIO GPIO_NUM_6 // Only RTC IO are allowed - ESP32 Pin example
RTC_DATA_ATTR int sleep_count = 0;

const int ledPin = D10; // GPIO 2 connected to LED

void show_wake_reason()
{
    sleep_count++;
    auto cause = esp_sleep_get_wakeup_cause();
    switch (cause)
    {
    case ESP_SLEEP_WAKEUP_UNDEFINED:
        Serial.println("Undefined"); // most likely a boot up after a reset or power cycly
        break;
    case ESP_SLEEP_WAKEUP_EXT0:
        Serial.println("Wakeup reason: EXT0");
        break;
    case ESP_SLEEP_WAKEUP_ULP:
        Serial.println("Wakeup reason: ULP");
        break;
    default:
        Serial.printf("Wakeup reason: %d\n", cause);
    }
    Serial.printf("Count %d\n", sleep_count);
}

void enter_sleep()
{
    Serial.println("Going to sleep...");
    delay(1000);

#ifdef DEEP_SLEEP_EXT0
    pinMode(BUTTON_GPIO, INPUT_PULLUP);
    rtc_gpio_hold_en(BUTTON_GPIO);
    esp_sleep_enable_ext0_wakeup(BUTTON_GPIO, LOW);
#endif
    esp_deep_sleep_start();
}

String createAuthTokenMessage(String token)
{
    JsonDocument doc;
    doc["token"] = token;
    doc["device"] = "esp";
    doc["user_id"] = NULL;
    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

void scaleAudioVolume(uint8_t *input, uint8_t *output, size_t length, int volume)
{
    // Convert volume from 0-100 range to 0.0-1.0 range
    float volumeScale = volume / 100.0f;

    // Process 16-bit samples (2 bytes per sample)
    for (size_t i = 0; i < length; i += 2)
    {
        // Convert two bytes to a 16-bit signed integer
        int16_t sample = (input[i + 1] << 8) | input[i];

        // Scale the sample
        float scaledSample = sample * volumeScale;

        // Clamp the value to prevent overflow
        if (scaledSample > 32767)
            scaledSample = 32767;
        if (scaledSample < -32768)
            scaledSample = -32768;

        // Convert back to bytes
        int16_t finalSample = (int16_t)scaledSample;
        output[i] = finalSample & 0xFF;
        output[i + 1] = (finalSample >> 8) & 0xFF;
    }
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WSc] Disconnected!\n");
        digitalWrite(LED_PIN, LOW);
        enter_sleep();
        break;
    case WStype_CONNECTED:
        Serial.printf("[WSc] Connected to url: %s\n", payload);
        authMessage = createAuthTokenMessage(authTokenGlobal);
        webSocket.sendTXT(authMessage);
        digitalWrite(LED_PIN, HIGH);
        break;
    case WStype_TEXT:
        // Serial.printf("[WSc] get text: %s\n", payload);

        if (strcmp((char *)payload, "END") == 0)
        {
            delay(1000);
            webSocket.sendTXT("{\"speaker\": \"user\", \"is_replying\": false, \"is_interrupted\": false, \"is_ending\": false, \"is_end_of_sentence\": false}");
            ;
        }
        else if (strcmp((char *)payload, "END_OF_SENTENCE") == 0)
        {
            webSocket.sendTXT("{\"speaker\": \"user\", \"is_replying\": true, \"is_interrupted\": false, \"is_ending\": false, \"is_end_of_sentence\": true}");
        }
        else
        {
            Serial.println((char *)payload);
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, (char *)payload);

            const char *type_content = doc["type"];
            if (strcmp(type_content, "auth_success") == 0)
            {
                Serial.println(type_content);
                currentVolume = doc["text_data"];
            }
        }
        break;
    case WStype_BIN:
    {
        // Create a buffer for the scaled audio
        uint8_t *scaledAudio = (uint8_t *)malloc(length);
        if (scaledAudio == nullptr)
        {
            Serial.println("Failed to allocate memory for audio scaling");
            return;
        }
        // Scale the audio based on currentVolume
        scaleAudioVolume(payload, scaledAudio, length, currentVolume);
        // Write the scaled audio to I2S
        size_t bytes_written;
        i2s_write(I2S_PORT_OUT, scaledAudio, length, &bytes_written, portMAX_DELAY);
        // Free the temporary buffer
        free(scaledAudio);
    }
    break;
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_PONG:
    case WStype_PING:
    case WStype_FRAGMENT_FIN:
        break;
    }
}

void websocket_setup(String server_domain, int port, String path)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Not connected to WiFi. Abandoning setup websocket");
        return;
    }
    Serial.println("connected to WiFi");
    webSocket.begin(server_domain, port, path);
    webSocket.onEvent(webSocketEvent);
    // webSocket.setAuthorization("user", "Password");
    webSocket.setReconnectInterval(1000);
}

void connectToWifiAndWS()
{
    // Attempt to connect to Wi-Fi and start WebSocket if needed
    if (!connectToWiFi())
    {
        Serial.println("Failed to connect to Wi-Fi. Good night!");
        enter_sleep();
        return;
    }

    // Connect to WebSocket if successfully registered
    Serial.println("Connecting to WebSocket server...");
    websocket_setup(backend_server, backend_port, websocket_path);
}

void buttonTask(void *parameter)
{
    while (1)
    {
        if (digitalRead(BUTTON_GPIO) == LOW)
        {
            Serial.println("Button pressed - enter sleep\n");
            webSocket.disconnect();
            delay(800);
            enter_sleep();
        }
        vTaskDelay(200);
    }
}

void micTask(void *parameter)
{
    i2s_install_mic();
    i2s_setpin_mic();
    i2s_start(I2S_PORT_IN);

    int i2s_read_len = I2S_READ_LEN;
    size_t bytes_read;

    char *i2s_read_buff = (char *)calloc(i2s_read_len, sizeof(char));
    uint8_t *flash_write_buff = (uint8_t *)calloc(i2s_read_len, sizeof(char));

    while (1)
    {
        esp_err_t result = i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len, &bytes_read, portMAX_DELAY);

        if (result == ESP_OK && webSocket.isConnected())
        {
            // Apply scaling to the read data
            i2s_adc_data_scale(flash_write_buff, (uint8_t *)i2s_read_buff, i2s_read_len);
            webSocket.sendBIN(flash_write_buff, (size_t)i2s_read_len);
        }
        vTaskDelay(10);
    }

    free(i2s_read_buff);
    i2s_read_buff = NULL;
    free(flash_write_buff);
    flash_write_buff = NULL;
    // vTaskDelete(NULL);
}

void setup()
{
    Serial.begin(115200);
    delay(500);

    show_wake_reason();
    // resetDevice();
    printStoredNetworks();

    pinMode(BUTTON_GPIO, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    xTaskCreate(buttonTask, "Button Task", 8192, NULL, 5, NULL);

    connectToWifiAndWS();
    i2s_install_speaker();
    i2s_setpin_speaker();

    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
}

void loop()
{

    static unsigned long lastWiFiCheckTime = 0;
    const unsigned long wifiCheckInterval = 10000; // Check every 10 seconds

    webSocket.loop();

    if (millis() - lastWiFiCheckTime >= wifiCheckInterval)
    {
        lastWiFiCheckTime = millis();

        // Check if Wi-Fi is connected
        if (WiFi.status() != WL_CONNECTED)
        {
            wifiMulti.run(connectTimeoutMs);
        }
    }
    vTaskDelay(10);
}
