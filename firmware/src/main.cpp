#include <driver/i2s.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <freertos/queue.h>
#include <WiFiManager.h> // Include the WiFiManager library

using namespace websockets;
WebsocketsClient client;
bool isWebSocketConnected;
WiFiManager wm;

#define BUTTON_PIN D5 // Built-in BOOT button (GPIO 0)
// #define LED_PIN LED_BUILTIN // Built-in LED (GPIO 10)

// I2S pins for Audio Input (INMP441 MEMS microphone)
#define I2S_SD D9
#define I2S_WS D8
#define I2S_SCK D7
#define I2S_PORT_IN I2S_NUM_0

// I2S pins for Audio Output (MAX98357A amplifier)
#define I2S_WS_OUT D0
#define I2S_BCK_OUT D1
#define I2S_DATA_OUT D2
#define I2S_PORT_OUT I2S_NUM_1
#define I2S_SD_OUT D3

#define SAMPLE_RATE 16000
#define bufferCnt 20
#define bufferLen 1024
int16_t sBuffer[bufferLen];

#define I2S_READ_LEN (1024)

// WiFi setup
// const char *ssid = "launchlab";          // replace your WiFi name
// const char *password = "LaunchLabRocks"; // replace your WiFi password
const char *ssid = "SKYCFZHN-2.4G";    // replace your WiFi name
const char *password = "CFaxCbZ9Y6CQ"; // replace your WiFi password

// WebSocket server information
// replace your WebSocket
const char *websocket_server = "192.168.0.30";
// WebSocket server port
const uint16_t websocket_port = 8000;
// const uint16_t websocket_port = 80;
const char *websocket_path = "/starmoon"; // WebSocket path
const char *auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNWFmNjJiMGUtM2RhNC00YzQ0LWFkZjctNWIxYjdjOWM0Y2I2IiwiZW1haWwiOiJhZG1pbkBzdGFybW9vbi5hcHAiLCJpYXQiOjE3Mjc4NjU0MTd9.jJn1ESU_N_uYk89Jui7ORMtfgTEmTVu123hpQtWBsQ4";
String authMessage;

void simpleAPSetup()
{
    // pinMode(LED_PIN, OUTPUT);
    // digitalWrite(LED_PIN, HIGH); // Turn off LED (assuming LOW turns it ON)

    // wm.resetSettings();
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

    if (!wm.autoConnect("Starmoon AI device"))
    {
        Serial.println("Failed to connect or hit timeout");
        ESP.restart(); // Optionally restart or handle the failure
    }

    // If connected
    Serial.println("Connected to Wi-Fi!");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    // Turn on the LED when connected
    // digitalWrite(LED_PIN, LOW); // LED ON when connected to Wi-Fi
}

// add a function to create a JSON message with the authentication token
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

void onWSConnectionOpened()
{
    authMessage = createAuthTokenMessage(auth_token);
    client.send(authMessage);
    Serial.println("Connnection Opened");
    // analogWrite(LED_PIN, 250);
    isWebSocketConnected = true;
}

void onWSConnectionClosed()
{
    // analogWrite(LED_PIN, 0);
    Serial.println("Connnection Closed");
    isWebSocketConnected = false;
}

void connectWiFi()
{
    WiFi.disconnect();
    // WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.println("Connecting to WiFi");
    Serial.println("");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("");
    Serial.println("WiFi connected");
    WiFi.setSleep(false);
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

void connectWSServer()
{
    client.onEvent(onEventsCallback);
    Serial.println("Connecting to WebSocket server...");
    while (!client.connect(websocket_server, websocket_port, websocket_path))
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("Websocket Connected!");
}

void onMessageCallback(WebsocketsMessage message)
{
    if (message.isBinary())
    {
        // Handle binary audio data
        size_t bytes_written;
        i2s_write(I2S_PORT_OUT, message.c_str(), message.length(), &bytes_written, portMAX_DELAY);
    }
}

void i2s_install_mic()
{
    // Set up I2S Processor configuration
    const i2s_config_t i2s_config = {
        .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = i2s_bits_per_sample_t(16),
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
        .intr_alloc_flags = 0,
        .dma_buf_count = bufferCnt,
        .dma_buf_len = bufferLen,
        .use_apll = false,
        // .tx_desc_auto_clear = true,
        // .fixed_mclk = 0
    };

    esp_err_t err = i2s_driver_install(I2S_PORT_IN, &i2s_config, 0, NULL);
    Serial.printf("I2S mic driver install: %s\n", esp_err_to_name(err));
}

void i2s_setpin_mic()
{
    // Set I2S pin configuration
    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = -1,
        .data_in_num = I2S_SD};

    i2s_set_pin(I2S_PORT_IN, &pin_config);
    // i2s_zero_dma_buffer(I2S_PORT_IN);
}

void i2s_install_speaker()
{
    // Set up I2S Processor configuration
    const i2s_config_t i2s_config = {
        .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = i2s_bits_per_sample_t(16),
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_MSB),
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = bufferCnt,
        .dma_buf_len = bufferLen,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0};

    esp_err_t err = i2s_driver_install(I2S_PORT_OUT, &i2s_config, 0, NULL);
    Serial.printf("I2S speaker driver install: %s\n", esp_err_to_name(err));
}

void i2s_setpin_speaker()
{
    // Set I2S pin configuration
    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCK_OUT,
        .ws_io_num = I2S_WS_OUT,
        .data_out_num = I2S_DATA_OUT,
        .data_in_num = -1};

    i2s_set_pin(I2S_PORT_OUT, &pin_config);
    i2s_zero_dma_buffer(I2S_PORT_OUT);
}

void i2s_adc_data_scale(uint8_t *d_buff, uint8_t *s_buff, uint32_t len)
{
    uint32_t j = 0;
    uint32_t dac_value = 0;
    for (int i = 0; i < len; i += 2)
    {
        dac_value = ((((uint16_t)(s_buff[i + 1] & 0xf) << 8) | ((s_buff[i + 0]))));
        d_buff[j++] = 0;
        d_buff[j++] = dac_value * 256 / 2048;
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
        i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len, &bytes_read, portMAX_DELAY);
        i2s_adc_data_scale(flash_write_buff, (uint8_t *)i2s_read_buff, i2s_read_len);
        client.sendBinary((const char *)flash_write_buff, i2s_read_len);
        ets_printf("Never Used Stack Size: %u\n", uxTaskGetStackHighWaterMark(NULL));
    }

    free(i2s_read_buff);
    i2s_read_buff = NULL;
    free(flash_write_buff);
    flash_write_buff = NULL;
}

void setup()
{
    Serial.begin(115200);
    connectWiFi();

    i2s_install_speaker();
    i2s_setpin_speaker();

    connectWSServer();

    xTaskCreatePinnedToCore(micTask, "micTask", 2048, NULL, 1, NULL, 1);
    // run callback when messages are received
    client.onMessage(onMessageCallback);
}

void loop()
{
    if (client.available())
    {
        client.poll();
    }
    // Delay to avoid watchdog issues
    // delay(10);
}