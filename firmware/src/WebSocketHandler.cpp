// WebSocketHandler.cpp
#include "WebSocketHandler.h"
#include "Config.h"

WebsocketsClient client; // Define client globally

bool isWebSocketConnected = false;
String authMessage;

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
    Serial.println("Connection Opened");
    isWebSocketConnected = true;
}

void onWSConnectionClosed()
{
    Serial.println("Connection Closed");
    isWebSocketConnected = false;
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
    Serial.println("WebSocket Connected!");
    client.onMessage(onMessageCallback);
}

int currentVolume = 10;

void onMessageCallback(WebsocketsMessage message)
{
    if (message.isBinary() && isWebSocketConnected)
    {
        const uint8_t *audioData = reinterpret_cast<const uint8_t *>(message.c_str());
        size_t dataLength = message.length();

        // Allocate a buffer for the modified audio data
        std::vector<int16_t> modifiedAudio(dataLength / 2);

        // Apply volume control
        for (size_t i = 0; i < dataLength; i += 2)
        {
            int16_t sample = (audioData[i + 1] << 8) | audioData[i];
            int32_t scaledSample = (sample * currentVolume) / 100;
            scaledSample = std::max(-32768, std::min(32767, scaledSample));
            modifiedAudio[i / 2] = static_cast<int16_t>(scaledSample);
        }

        size_t bytes_written;
        i2s_write(I2S_PORT_OUT, modifiedAudio.data(), dataLength, &bytes_written, portMAX_DELAY);
    }
    else if (message.isText())
    {
        const char *msgText = message.c_str();

        if (strcmp(msgText, "END") == 0)
        {
            Serial.print("Got Message: ");
            Serial.println(msgText);
            delay(800);
            client.send("{\"speaker\": \"user\", \"is_replying\": false, \"is_interrupted\": false, \"is_ending\": false}");
        }
        else
        {
            Serial.println(msgText);
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, msgText);

            const char *type_content = doc["type"];
            if (strcmp(type_content, "auth_success") == 0)
            {
                Serial.println(type_content);
                currentVolume = doc["text_data"];
            }
        }
    }
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
