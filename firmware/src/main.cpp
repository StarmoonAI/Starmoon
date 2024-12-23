#include <Arduino.h> //not needed in the arduino ide

// Captive Portal
#include "OTA.h"
#include <AsyncTCP.h> //https://github.com/me-no-dev/AsyncTCP using the latest dev version from @me-no-dev
#include <DNSServer.h>
#include <ESPAsyncWebServer.h> //https://github.com/me-no-dev/ESPAsyncWebServer using the latest dev version from @me-no-dev
#include <esp_wifi.h>          //Used for mpdu_rx_disable android workaround
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <driver/rtc_io.h>
#include "Button.h"
#include "I2SHandler.h"
#include "LEDHandler.h"

bool use_auth_token = true;
#define uS_TO_S_FACTOR 1000000ULL
esp_err_t getErr = ESP_OK;

// Pre reading on the fundamentals of captive portals https://textslashplain.com/2022/06/24/captive-portals/

#define MAX_CLIENTS 4  // ESP32 supports up to 10 but I have not tested it yet
#define WIFI_CHANNEL 6 // 2.4ghz channel 6 https://en.wikipedia.org/wiki/List_of_WLAN_channels#2.4_GHz_(802.11b/g/n/ax)
const gpio_num_t BOOT_BUTTON_PIN = GPIO_NUM_0;

const IPAddress localIP(4, 3, 2, 1);          // the IP address the web server, Samsung requires the IP to be in public space
const IPAddress gatewayIP(4, 3, 2, 1);        // IP address of the network should be the same as the local IP for captive portals
const IPAddress subnetMask(255, 255, 255, 0); // no need to change: https://avinetworks.com/glossary/subnet-mask/

const String localIPURL = "http://4.3.2.1"; // a string version of the local IP with http, used for redirecting clients to your webpage

DNSServer dnsServer;
AsyncWebServer server(80);
int currentVolume = 50;

String authMessage;
DeviceState deviceState = STATE_CONNECTING;

int AP_status = 0;

static volatile bool shouldEnterSleep = false;
static volatile bool shouldFactoryReset = false;

void enterSleep()
{
    Serial.println("Going to sleep...");
    webSocket.sendTXT("{\"speaker\": \"user\", \"is_ending\": true}");
    webSocket.disconnect();
    delay(200);
    Serial.flush();
    esp_deep_sleep_start();
}

static void onBootButtonDoubleClickCb(void *button_handle, void *usr_data)
{
    Serial.println("Boot button double click");
}

void factoryResetDevice()
{
    Serial.println("Factory reset device");
    // clear auth NVS
    preferences.begin("auth", false);
    preferences.clear();
    preferences.end();

    // clear wifi NVS
    preferences.begin("wifi", false);
    preferences.clear();
    preferences.end();

    // clear wifi NVS
    preferences.begin("wifi_store", false);
    preferences.clear();
    preferences.end();
}

void printOutESP32Error(esp_err_t err)
{
    switch (err)
    {
    case ESP_OK:
        Serial.println("ESP_OK no errors");
        break;
    case ESP_ERR_INVALID_ARG:
        Serial.println("ESP_ERR_INVALID_ARG if the selected GPIO is not an RTC GPIO, or the mode is invalid");
        break;
    case ESP_ERR_INVALID_STATE:
        Serial.println("ESP_ERR_INVALID_STATE if wakeup triggers conflict or wireless not stopped");
        break;
    default:
        Serial.printf("Unknown error code: %d\n", err);
        break;
    }
}

static void onButtonPressDownRepeatCb(void *button_handle, void *usr_data)
{
    if (webSocket.isConnected())
    {
        Serial.println("Button press down repeat");
        deviceState = STATE_LISTENING;
        webSocket.sendTXT("{\"speaker\": \"user\", \"is_interrupted\": true}");
    }
}

static void onButtonLongPressStartEventCb(void *button_handle, void *usr_data)
{
    if (webSocket.isConnected())
    {
        Serial.println("Button long press hold");
        // add red led flash
        deviceState = STATE_LONG_PRESS_END;
    }
}

static void onButtonLongPressUpEventCb(void *button_handle, void *usr_data)
{
    Serial.println("Button long press end");
    delay(10);
    enterSleep();
}

static void onButtonDoubleClickCb(void *button_handle, void *usr_data)
{
    Serial.println("Button double click");
    delay(10);
    enterSleep();
}

String urlEncode(const String &msg)
{
    String encodedMsg = "";
    char c;
    char code0;
    char code1;
    for (int i = 0; i < msg.length(); i++)
    {
        c = msg.charAt(i);
        if (c == ' ')
        {
            encodedMsg += '+';
        }
        else if (isalnum(c))
        {
            encodedMsg += c;
        }
        else
        {
            code1 = (c & 0xf) + '0';
            if ((c & 0xf) > 9)
            {
                code1 = (c & 0xf) - 10 + 'A';
            }
            c = (c >> 4) & 0xf;
            code0 = c + '0';
            if (c > 9)
            {
                code0 = c - 10 + 'A';
            }
            encodedMsg += '%';
            encodedMsg += code0;
            encodedMsg += code1;
        }
    }
    return encodedMsg;
}

void handleDeviceRegister(AsyncWebServerRequest *request)
{
    Serial.println("Starting device registration...");

    String deviceCode = request->arg("code");
    String email = request->arg("email");

    if (!use_auth_token)
    {
        // Input validation
        if (deviceCode.isEmpty() || email.isEmpty())
        {
            request->redirect("/register?error=" + urlEncode("Both email and device code are required."));
            return;
        }

        if (WiFi.status() != WL_CONNECTED)
        {
            request->redirect("/register?error=" + urlEncode("Please connect to Wi-Fi first."));
            return;
        }

        if (!authTokenGlobal.isEmpty())
        {
            request->redirect("/complete");
            return;
        }

        HTTPClient http;
        String url = "http://" + String(backend_server) + ":" + String(backend_port) +
                     "/api/hardware_auth?email=" + email +
                     "&device_code=" + deviceCode +
                     "&mac_address=" + WiFi.macAddress();

        http.begin(url);
        http.setTimeout(10000);

        int httpCode = http.GET();

        switch (httpCode)
        {
        case HTTP_CODE_OK:
        {
            String payload = http.getString();
            if (payload == "INVALID_CODE")
            {
                request->redirect("/register?error=" + urlEncode("We couldn't find your device code. Try again or contact us."));
            }
            else if (payload == "INVALID_EMAIL")
            {
                request->redirect("/register?error=" + urlEncode("We couldn't find your email. Use the email you used to signup to Starmoon."));
            }
            else if (!payload.isEmpty())
            {
                // Store the auth token in NVS
                preferences.begin("auth", false);
                preferences.putString("auth_token", payload);
                preferences.end();

                authTokenGlobal = String(payload);
                request->redirect("/complete");
            }
            break;
        }
        case HTTP_CODE_BAD_REQUEST:
            request->redirect("/register?error=" + urlEncode("Please check your email and device code."));
            break;
        case HTTP_CODE_UNAUTHORIZED:
            request->redirect("/register?error=" + urlEncode("Unauthorized access. Contact us if you're stuck."));
            break;
        case HTTP_CODE_FORBIDDEN:
            request->redirect("/register?error=" + urlEncode("Access forbidden. Please contact support."));
            break;
        case HTTP_CODE_INTERNAL_SERVER_ERROR:
            request->redirect("/register?error=" + urlEncode("Server error. Please try again or contact support."));
            break;
        case -1:
            request->redirect("/register?error=" + urlEncode("Could not connect to server. Please check your internet connection."));
            break;
        default:
            request->redirect("/register?error=" + urlEncode("Unexpected error (" + String(httpCode) + "). Please try again."));
        }

        http.end();
    }
    else
    {
        if (!deviceCode.isEmpty())
        {
            preferences.begin("auth", false);
            preferences.putString("auth_token", deviceCode);
            preferences.end();

            authTokenGlobal = String(deviceCode);
            request->redirect("/complete");
        }
    }
}

int wifiConnect()
{
    WiFi.mode(WIFI_MODE_STA); // Add this to ensure we're in station mode

    // Begin with no arguments to load last stored credentials from NVS
    WiFi.begin();

    // Wait until connected
    unsigned long startMillis = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startMillis < 10000)
    {
        delay(100);
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.printf("Quick reconnect: Connected to %s\n", WiFi.SSID().c_str());
        Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
        WiFi.setSleep(false); // Disable power saving

        return 1;
    }

    preferences.begin("wifi_store");
    int numNetworks = preferences.getInt("numNetworks", 0);
    if (numNetworks == 0)
    {
        preferences.end();
        return 0;
    }

    // Try each stored network
    for (int i = 0; i < numNetworks; ++i)
    {
        String ssid = preferences.getString(("ssid" + String(i)).c_str(), "");
        String password = preferences.getString(("password" + String(i)).c_str(), "");

        if (ssid.length() > 0 && password.length() > 0)
        {
            Serial.printf("Attempting connection to %s\n", ssid.c_str());

            WiFi.begin(ssid.c_str(), password.c_str());

            // More reasonable timeout: 15 seconds (10 * 500ms = 10s)
            int attempts = 0;
            while (WiFi.status() != WL_CONNECTED && attempts < 20)
            {
                delay(500); // Longer delay between attempts
                Serial.print(".");
                attempts++;
            }
            Serial.println();

            if (WiFi.status() == WL_CONNECTED)
            {
                Serial.printf("Connected to %s\n", ssid.c_str());
                Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
                WiFi.setSleep(false); // Disable power saving
                preferences.end();

                return 1;
            }

            Serial.printf("Failed to connect to %s\n", ssid.c_str());
        }
    }

    preferences.end();
    return 0;
}

void handleComplete(AsyncWebServerRequest *request)
{
    request->send(200, "text/html", "<!DOCTYPE html>"
                                    "<html lang='en'>"
                                    "<head>"
                                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                                    "<style>"
                                    "body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #fff8e1; }" // Light yellow background
                                    ".container { padding: 20px; max-width: 600px; margin: auto; }"
                                    ".header { background: #facc15; color: black; padding: 15px 0; text-align: center; font-weight: bold; border-radius: 8px 8px 0 0; }"         // Yellow header with black text
                                    ".content { background: #ffffff; border-radius: 0 0 8px 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center; }" // White content area
                                    "h1 { color: #333; margin-bottom: 20px; }"
                                    "p { color: #666; margin: 10px 0; }"
                                    "</style>"
                                    "</head>"
                                    "<body>"
                                    "<div class='container'>"
                                    "<div class='header'>Starmoon AI - Setup Complete</div>"
                                    "<div class='content'>"
                                    "<h1>Setup Complete</h1>"
                                    "<p>Your device is ready to use.</p>"
                                    "<p>The setup network will now close.</p>"
                                    "</div>"
                                    "</div>"
                                    "</body>"
                                    "</html>");
}

void handleRegister(AsyncWebServerRequest *request)
{
    if (authTokenGlobal.isEmpty())
    {
        String error_message = "";
        if (request->hasParam("error"))
        {
            error_message = "<div style='margin: 20px 0; padding: 10px; background: #ffebee; border-radius: 5px; color: #c62828;'>" +
                            request->getParam("error")->value() + "</div>";
        }

        String html = "<!DOCTYPE html>"
                      "<html lang='en'>"
                      "<head>"
                      "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                      "<style>"
                      "body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #fff8e1; }" // Light yellow background
                      ".container { padding: 20px; max-width: 600px; margin: auto; }"
                      ".header { background: #facc15; color: black; padding: 15px 0; text-align: center; font-weight: bold; border-radius: 8px 8px 0 0; }" // Yellow header with black text and rounded top corners
                      ".content { background: #ffffff; border-radius: 0 0 8px 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }"             // Rounded bottom corners
                      ".error { margin: 20px 0; padding: 10px; background: #ffebee; border-radius: 5px; color: #c62828; }"
                      "input[type='text'], input[type='email'] { width: calc(100% - 22px); padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }"
                      "input[type='submit'] { background: #facc15; color: black; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }" // Yellow button with black text
                      "input[type='submit']:hover { background: #fdd835; }"                                                                                                           // Slightly darker yellow on hover
                      "</style>"
                      "</head>"
                      "<body>"
                      "<div class='container'>"
                      "<div class='header'>Starmoon AI - Register Device</div>"
                      "<div class='content'>"
                      "<p>Connected to: <strong>" +
                      WiFi.SSID() + "</strong></p>" // Replaced emoji with text
                      + error_message +
                      "<form action='/register' method='POST'>"
                      "Device Code: <input type='text' name='code' placeholder='Enter Device Code'><br>"
                      "Email: <input type='email' name='email' placeholder='Enter Email'><br>"
                      "<input type='submit' value='Register'>"
                      "</form>"
                      "</div>"
                      "</div>"
                      "</body>"
                      "</html>";
        request->send(200, "text/html", html);
    }
    else
    {
        request->redirect("/complete");
    }
}

void handleRoot(AsyncWebServerRequest *request)
{
    String notConnected = ""; // Initialize with empty string
    if (request->hasParam("not_connected"))
    {
        notConnected = request->getParam("not_connected")->value();
    }
    if (WiFi.status() != WL_CONNECTED)
    {
        String html = "<!DOCTYPE html>"
                      "<html lang='en'>"
                      "<head>"
                      "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                      "<style>"
                      "body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #fff8e1; }" // Light yellow background
                      ".container { padding: 20px; max-width: 600px; margin: auto; }"
                      ".header { background: #facc15; color: black; padding: 15px 0; text-align: center; font-weight: bold; border-radius: 8px 8px 0 0; }" // Yellow header with black text and rounded top corners
                      ".content { background: #ffffff; border-radius: 0 0 8px 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }"             // Rounded bottom corners
                      ".error { margin: 20px 0; padding: 10px; background: #ffebee; border-radius: 5px; color: #c62828; }"
                      "input[type='text'], input[type='password'] { width: calc(100% - 22px); padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }"
                      "input[type='submit'] { background: #facc15; color: black; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }" // Yellow button with black text
                      "input[type='submit']:hover { background: #fdd835; }"                                                                                                           // Slightly darker yellow on hover
                      "</style>"
                      "</head>"
                      "<body>"
                      "<div class='container'>"
                      "<div class='header'>Starmoon AI</div>"
                      "<div class='content'>"
                      "<h1>Connect to Wi-Fi</h1>";
        if (strcmp(notConnected.c_str(), "true") == 0)
        {
            html += "<p class='error'>The network connection failed, please try again.</p>";
        }
        html += "<form action='/wifi' method='POST'>"
                "SSID: <input type='text' name='ssid' required><br>"
                "Password: <input type='password' name='password' required><br>"
                "<input type='submit' value='Connect'>"
                "</form>"
                "</div>"
                "</div>"
                "</body>"
                "</html>";
        request->send(200, "text/html", html);
    }
    else
    {
        request->redirect("/register");
    }
}

void handleWifiSave(AsyncWebServerRequest *request)
{
    Serial.println("Start Save!");
    String ssid = request->arg("ssid");
    String password = request->arg("password");

    // Attempt to connect to the provided Wi-Fi credentials
    Serial.print("Connecting to ");
    Serial.println(ssid);
    WiFi.begin(ssid.c_str(), password.c_str());

    // Wait for connection
    int attempts = 30; // 30 * 100ms = 3 seconds
    while (attempts-- && WiFi.status() != WL_CONNECTED)
    {
        delay(100);
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Successfully connected to WiFi!");

        // Now that we're connected, save/update the credentials
        preferences.begin("wifi_store", false);
        int numNetworks = preferences.getInt("numNetworks", 0);

        // Check if this SSID already exists
        bool updated = false;
        for (int i = 0; i < numNetworks; ++i)
        {
            String storedSsid = preferences.getString(("ssid" + String(i)).c_str(), "");
            if (storedSsid == ssid)
            {
                preferences.putString(("password" + String(i)).c_str(), password);
                Serial.println("Success Update!");
                updated = true;
                break;
            }
        }

        // If it's a new network, add it
        if (!updated)
        {
            preferences.putString(("ssid" + String(numNetworks)).c_str(), ssid);
            preferences.putString(("password" + String(numNetworks)).c_str(), password);
            preferences.putInt("numNetworks", numNetworks + 1);
            Serial.println("Success Save!");
        }

        request->redirect("/register");
        preferences.end();
    }
    else
    {
        Serial.println("Failed to connect to WiFi");
        request->redirect("/?not_connected=true");
    }
}

void setUpDNSServer(DNSServer &dnsServer, const IPAddress &localIP)
{
// Define the DNS interval in milliseconds between processing DNS requests
#define DNS_INTERVAL 30

    // Set the TTL for DNS response and start the DNS server
    dnsServer.setTTL(3600);
    dnsServer.start(53, "*", localIP);
}

void startSoftAccessPoint(const char *ssid, const char *password, const IPAddress &localIP, const IPAddress &gatewayIP)
{
// Define the maximum number of clients that can connect to the server
#define MAX_CLIENTS 4
// Define the WiFi channel to be used (channel 6 in this case)
#define WIFI_CHANNEL 6

    // Set the WiFi mode to access point and station
    WiFi.mode(WIFI_MODE_AP);

    // Define the subnet mask for the WiFi network
    const IPAddress subnetMask(255, 255, 255, 0);

    // Configure the soft access point with a specific IP and subnet mask
    WiFi.softAPConfig(localIP, gatewayIP, subnetMask);

    // Start the soft access point with the given ssid, password, channel, max number of clients
    WiFi.softAP(ssid, password, WIFI_CHANNEL, 0, MAX_CLIENTS);

    // Disable AMPDU RX on the ESP32 WiFi to fix a bug on Android
    esp_wifi_stop();
    esp_wifi_deinit();
    wifi_init_config_t my_config = WIFI_INIT_CONFIG_DEFAULT();
    my_config.ampdu_rx_enable = false;
    esp_wifi_init(&my_config);
    esp_wifi_start();
    vTaskDelay(100 / portTICK_PERIOD_MS); // Add a small delay
}

void setUpWebserver(AsyncWebServer &server, const IPAddress &localIP)
{
    //======================== Webserver ========================
    // WARNING IOS (and maybe macos) WILL NOT POP UP IF IT CONTAINS THE WORD "Success" https://www.esp8266.com/viewtopic.php?f=34&t=4398
    // SAFARI (IOS) IS STUPID, G-ZIPPED FILES CAN'T END IN .GZ https://github.com/homieiot/homie-esp8266/issues/476 this is fixed by the webserver serve static function.
    // SAFARI (IOS) there is a 128KB limit to the size of the HTML. The HTML can reference external resources/images that bring the total over 128KB
    // SAFARI (IOS) popup browser has some severe limitations (javascript disabled, cookies disabled)

    // Required
    server.on("/connecttest.txt", [](AsyncWebServerRequest *request)
              { request->redirect("http://logout.net"); }); // windows 11 captive portal workaround
    server.on("/wpad.dat", [](AsyncWebServerRequest *request)
              { request->send(404); }); // Honestly don't understand what this is but a 404 stops win 10 keep calling this repeatedly and panicking the esp32 :)

    // Background responses: Probably not all are Required, but some are. Others might speed things up?
    // A Tier (commonly used by modern systems)
    server.on("/generate_204", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // android captive portal redirect
    server.on("/redirect", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // microsoft redirect
    server.on("/hotspot-detect.html", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // apple call home
    server.on("/canonical.html", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // firefox captive portal call home
    server.on("/success.txt", [](AsyncWebServerRequest *request)
              { request->send(200); }); // firefox captive portal call home
    server.on("/ncsi.txt", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // windows call home

    // B Tier (uncommon)
    //  server.on("/chrome-variations/seed",[](AsyncWebServerRequest *request){request->send(200);}); //chrome captive portal call home
    //  server.on("/service/update2/json",[](AsyncWebServerRequest *request){request->send(200);}); //firefox?
    //  server.on("/chat",[](AsyncWebServerRequest *request){request->send(404);}); //No stop asking Whatsapp, there is no internet connection
    //  server.on("/startpage",[](AsyncWebServerRequest *request){request->redirect(localIPURL);});

    // return 404 to webpage icon
    server.on("/favicon.ico", [](AsyncWebServerRequest *request)
              { request->send(404); }); // webpage icon

    server.on("/", HTTP_GET, handleRoot);
    server.on("/wifi", HTTP_POST, handleWifiSave);
    server.on("/register", HTTP_POST, handleDeviceRegister);
    server.on("/register", HTTP_GET, handleRegister);
    server.on("/complete", HTTP_GET, handleComplete);

    // the catch all
    server.onNotFound([](AsyncWebServerRequest *request)
                      {
		request->redirect(localIPURL);
		Serial.print("onnotfound ");
		Serial.print(request->host());	// This gives some insight into whatever was being requested on the serial monitor
		Serial.print(" ");
		Serial.print(request->url());
		Serial.print(" sent redirect to " + localIPURL + "\n"); });
}

String getAPSSIDName()
{
    // Get the MAC address of the device
    String macAddress = WiFi.macAddress();
    macAddress.replace(":", "");
    String lastFourMac = macAddress.substring(macAddress.length() - 4); // Get the last 4 characters
    String ssid = "Starmoon-" + lastFourMac;
    return ssid;
}

void openAP()
{
    deviceState = STATE_SETUP;
    AP_status = 1;
    startSoftAccessPoint(getAPSSIDName().c_str(), NULL, localIP, gatewayIP);
    setUpDNSServer(dnsServer, localIP);
    setUpWebserver(server, localIP);
    server.begin();
}

void closeAP()
{
    deviceState = STATE_CONNECTING;
    dnsServer.stop();
    server.end();
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_MODE_STA);
    AP_status = 0;
    Serial.println("Closed Access Point and DNS server");
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
    float volumeScale = volume / 200.0f;

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
        deviceState = STATE_CONNECTING;
        // vTaskDelay(500);
        // enterSleep();
        break;
    case WStype_CONNECTED:
        // Serial.printf("[WSc] Connected to url: %s\n", payload);
        authMessage = createAuthTokenMessage(authTokenGlobal);
        // authMessage = createAuthTokenMessage(auth_token);
        webSocket.sendTXT(authMessage);
        // Send the message over WebSocket
        webSocket.sendTXT("{\"speaker\": \"user\", \"rssi\": " + String(WiFi.RSSI()) + "}");

        deviceState = STATE_RESPONDING; // first message is always a response
        // digitalWrite(BLUE_LED_PIN, HIGH);
        break;
    case WStype_TEXT:
    {
        Serial.println((char *)payload);
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, (char *)payload);

        if (error)
        {
            Serial.println("Error deserializing JSON");
            deviceState = STATE_ERROR;
            return;
        }

        const char *type_content = doc["type"];
        if (strcmp(type_content, "gap") == 0)
        {
            webSocket.sendTXT("{\"speaker\": \"user\", \"add_buffer\": true}");
            // get the current wifi strength
            // Get the RSSI value
            int rssi = WiFi.RSSI();
            Serial.print("RSSI: ");
            Serial.println(rssi);
            // Send the message over WebSocket
            webSocket.sendTXT("{\"speaker\": \"user\", \"rssi\": " + String(rssi) + "}");
        }
        else if (strcmp(type_content, "info") == 0)
        {
            Serial.println(doc.as<String>());
            if (doc["text_data"] == "END")
            {
                delay(300);
                webSocket.sendTXT("{\"speaker\": \"user\", \"speech_end\": true}");
                deviceState = STATE_LISTENING;
            }
            else if (doc["text_data"] == "START")
            {
                webSocket.sendTXT("{\"speaker\": \"user\", \"speech_start\": true}");
                deviceState = STATE_RESPONDING;
            }
            else if (doc["text_data"] == "PROCESSING")
            {
                Serial.println("Processing");
                deviceState = STATE_WAITING_FOR_RESPONSE;
            }
        }
        else if (strcmp(type_content, "auth_success") == 0)
        {
            // Serial.println(type_content);
            currentVolume = doc["text_data"]["volume"].as<int>();

            if (doc["text_data"]["is_ota"] == true)
            {
                Serial.println("OTA update received");
                setOTAStatusInNVS(true);
                ESP.restart();
            }
            if (doc["text_data"]["is_reset"] == true)
            {
                Serial.println("Reset update received");
                factoryResetDevice();
                delay(10);
                webSocket.disconnect();
                delay(10);
                WiFi.disconnect();
                delay(10);
                enterSleep();
            }
        }
        else if (strcmp(type_content, "warning") == 0)
        {
            if (doc["text_data"] == "TIMEOUT")
            {
                // Serial.println("Timeout received. Going to sleep...");
                deviceState = STATE_ERROR;
                webSocket.disconnect();
                delay(800);
                enterSleep();
            }
        }
        else if (strcmp(type_content, "credits_warning") == 0)
        {
            deviceState = STATE_ERROR;
            webSocket.disconnect();
            delay(800);
            enterSleep();
        }
    }
    break;
    case WStype_BIN:
    {
#define AUDIO_BUFFER_SIZE 4096
        uint8_t scaledAudioBuffer[AUDIO_BUFFER_SIZE];
        if (length > AUDIO_BUFFER_SIZE)
        {
            Serial.println("Audio buffer overflow, skipping!");
            return;
        }

        // Scale the audio directly into the pre-allocated buffer
        scaleAudioVolume(payload, scaledAudioBuffer, length, currentVolume);

        // Write to I2S
        size_t bytes_written;
        i2s_write(I2S_PORT_OUT, scaledAudioBuffer, length, &bytes_written, portMAX_DELAY);

        // // Print how many bytes were actually written
        // // Serial.printf("Bytes written to I2S: %d\n\n", bytes_written);

        // Free the temporary buffer
        // free(scaledAudio);
    }
    break;
    case WStype_ERROR:
        deviceState = STATE_ERROR;
        Serial.printf("[WSc] Error: %s\n", payload);
        break;
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_PONG:
    case WStype_PING:
    case WStype_FRAGMENT_FIN:
    default:
        deviceState = STATE_ERROR;
        Serial.printf("[WSc] Unknown event type: %d\n", type);
        break;
    }
}

void websocketSetup(String server_domain, int port, String path)
{
    if (AP_status == 1)
    {
        closeAP();
    }
    Serial.println("Connecting to WebSocket server...");
    webSocket.begin(server_domain, port, path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(1000);
}

void connectToWifiAndWebSocket()
{
    int result = wifiConnect();
    if (result == 1 && !authTokenGlobal.isEmpty()) // Successfully connected and has auth token
    {
        Serial.println("WiFi connected with existing network!");
        if (ota_status)
        {
            performOTAUpdate();
            Serial.println("Please Wait it takes some time ...");
        }
        else
        {
            websocketSetup(backend_server, backend_port, websocket_path);
        }
        return; // Connection successful
    }

    openAP(); // Start the AP immediately as a fallback

    // Wait for user interaction or timeout
    unsigned long startTime = millis();
    const unsigned long timeout = 300000; // 5 minutes

    Serial.println("Waiting for user interaction or timeout...");
    while ((millis() - startTime) < timeout)
    {
        dnsServer.processNextRequest(); // Process DNS requests
        if (WiFi.status() == WL_CONNECTED && !authTokenGlobal.isEmpty())
        {
            Serial.println("WiFi connected while AP was active!");
            if (ota_status)
            {
                performOTAUpdate();
                Serial.println("Please Wait it takes some time ...");
            }
            else
            {
                websocketSetup(backend_server, backend_port, websocket_path);
            }
            return;
        }
        yield();
    }

    Serial.println("Timeout expired. Going to sleep.");
    enterSleep();
}

void getAuthTokenFromNVS()
{
    preferences.begin("auth", false);
    authTokenGlobal = preferences.getString("auth_token", "");
    Serial.print("authTokenGlobal: ");
    Serial.println(authTokenGlobal);
    preferences.end();
}

void setup()
{
    Serial.setTxBufferSize(1024);
    Serial.begin(115200);
    // factoryResetDevice();

    setupRGBLED();

    while (!Serial)
        ;

    // Print a welcome message to the Serial port.
    Serial.println("\n\nCaptive Test, V0.5.0 compiled " __DATE__ " " __TIME__ " by CD_FER"); //__DATE__ is provided by the platformio ide
    Serial.printf("%s-%d\n\r", ESP.getChipModel(), ESP.getChipRevision());

    getErr = esp_sleep_enable_ext0_wakeup(BUTTON_PIN, LOW);
    printOutESP32Error(getErr);

    xTaskCreate(ledTask, "LED Task", 4096, NULL, 5, NULL);

    Button *btn = new Button(BUTTON_PIN, false);
    // Main button
    btn->attachPressDownEventCb(&onButtonPressDownRepeatCb, NULL);
    btn->attachLongPressStartEventCb(&onButtonLongPressStartEventCb, NULL);
    btn->attachLongPressUpEventCb(&onButtonLongPressUpEventCb, NULL);
    btn->attachDoubleClickEventCb(&onButtonDoubleClickCb, NULL);
    btn->detachSingleClickEvent();

    getAuthTokenFromNVS();
    getOTAStatusFromNVS();

    if (ota_status)
    {
        deviceState = STATE_OTAING;
    }
    else
    {
        deviceState = STATE_CONNECTING;
    }

    connectToWifiAndWebSocket();

    i2s_install_speaker();
    i2s_setpin_speaker();

    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);

    Serial.print("\n");
    Serial.print("Startup Time:"); // should be somewhere between 270-350 for Generic ESP32 (D0WDQ6 chip, can have a higher startup time on first boot)
    Serial.println(millis());
    Serial.print("\n");
}

void loop()
{
    if (!ota_status)
    {
        webSocket.loop();
        if (WiFi.getMode() == WIFI_MODE_AP)
        {
            dnsServer.processNextRequest();
        }
    }
    else
    {
        OTA_status();
    }
    delay(10); // seems to help with stability, if you are doing other things in the loop this may not be needed
}