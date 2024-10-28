#include "WiFiSetup.h"
#include "Config.h"

Preferences preferences;
WiFiManager wm;
WiFiMulti wifiMulti;

String userEmail;
String deviceCode;
String backendResponse;
const int MAX_WIFI_NETWORKS = 5;

WiFiManagerParameter register_heading("<h2 style='text-align:center;'>Register your Starmoon device</h2>");
WiFiManagerParameter custom_email("email", "Email", "", 40);
WiFiManagerParameter custom_device_code("device_code", "Device Code", "", 40);

/******************************************* */
// WiFi Credentials Storage Functions
/******************************************* */

void addNetworkToWifiMulti(String ssid, String password)
{
    wifiMulti.addAP(ssid.c_str(), password.c_str());
}

// Function to store WiFi credentials in NVS
void storeWiFiCredentials(const String &ssid, const String &password, int index)
{
    if (index < 0 || index >= MAX_WIFI_NETWORKS)
        return; // Validate index

    preferences.begin("wifi", false); // Open preferences in RW mode

    // Create keys for this index
    String ssidKey = "ssid" + String(index);
    String passKey = "pass" + String(index);
    String validKey = "valid" + String(index);

    // Store the credentials
    preferences.putString(ssidKey.c_str(), ssid);
    preferences.putString(passKey.c_str(), password);
    preferences.putBool(validKey.c_str(), true);

    // Store the last used index
    preferences.putInt("lastIndex", index);

    preferences.end();

    // Add the network to WiFiMulti
    addNetworkToWifiMulti(ssid, password);
}

// Function to load WiFi credentials from NVS
WifiCredential loadWiFiCredentials(int index)
{
    WifiCredential cred;
    if (index < 0 || index >= MAX_WIFI_NETWORKS)
    {
        cred.isValid = false;
        return cred;
    }

    preferences.begin("wifi", true); // Open preferences in read-only mode

    String ssidKey = "ssid" + String(index);
    String passKey = "pass" + String(index);
    String validKey = "valid" + String(index);

    cred.ssid = preferences.getString(ssidKey.c_str(), "");
    cred.password = preferences.getString(passKey.c_str(), "");
    cred.isValid = preferences.getBool(validKey.c_str(), false);

    preferences.end();
    return cred;
}

// Function to get the next available index for storing credentials
int getNextStorageIndex()
{
    preferences.begin("wifi", true);
    int lastIndex = preferences.getInt("lastIndex", -1);
    preferences.end();

    // Return next index (0,1,2) in circular fashion
    return (lastIndex + 1) % MAX_WIFI_NETWORKS;
}

// Function to get all stored networks
WifiCredential *getAllStoredNetworks()
{
    static WifiCredential networks[MAX_WIFI_NETWORKS];

    for (int i = 0; i < MAX_WIFI_NETWORKS; i++)
    {
        networks[i] = loadWiFiCredentials(i);
    }

    return networks;
}

// Utility function to print all stored networks (for debugging)
void printStoredNetworks()
{
    WifiCredential *networks = getAllStoredNetworks();

    for (int i = 0; i < MAX_WIFI_NETWORKS; i++)
    {
        if (networks[i].isValid)
        {
            Serial.printf("Network %d: SSID=%s, Password=%s\n",
                          i, networks[i].ssid.c_str(), networks[i].password.c_str());
        }
        else
        {
            Serial.printf("Network %d: <empty>\n", i);
        }
    }
}

/******************************************* */
// Wifi Manager Functions
/******************************************* */

void storeStatusMessage(const String &message)
{
    preferences.begin("wifi", false);            // Open the NVS namespace "wifi"
    preferences.putString("lastError", message); // Store the error message
    preferences.end();                           // Close the namespace
}

String getStatusMessage()
{
    preferences.begin("wifi", true);                         // Open the NVS namespace for reading
    String message = preferences.getString("lastError", ""); // Retrieve the last error message
    preferences.end();                                       // Close the namespace

    if (message.isEmpty())
    {
        return "Your device is ready for setup. Press \"Configure WiFi\" to get started.";
    }
    return message;
}

String registerDevice(String ssid)
{
    if (!authTokenGlobal.isEmpty())
    {
        return "Good news! Your device is already registered.";
    }

    if (userEmail.isEmpty() || deviceCode.isEmpty())
    {
        return "Oops! Both email and device code are required.";
    }

    if (WiFi.status() != WL_CONNECTED)
    {
        return "Hang on there! You are not connected to Wi-Fi.";
    }

    HTTPClient http;
    String response_message = "";

    // Construct the URL with query parameters
    String url = "http://" + String(backend_server) + ":" + String(backend_port) +
                 "/api/hardware_auth?email=" + userEmail +
                 "&device_code=" + deviceCode +
                 "&mac_address=" + WiFi.macAddress();

    Serial.println("Making request to: " + url);
    http.begin(url);

    // Set timeout for the request
    http.setTimeout(10000); // 10 seconds timeout

    int httpCode = http.GET();
    Serial.printf("HTTP Response code: %d\n", httpCode);

    // Handle different HTTP status codes
    switch (httpCode)
    {
    case HTTP_CODE_OK: // 200
    {
        String payload = http.getString();
        if (payload == "INVALID_CODE")
        {
            response_message = "We tried but we couldn't find your device code. Try again or contact us.";
            Serial.println(response_message);
        }
        else if (payload == "INVALID_EMAIL")
        {
            response_message = "We tried but couldn't find your email. Use the email you used to signup to Starmoon.";
            Serial.println(response_message);
        }
        else if (!payload.isEmpty())
        {
            // Store the auth token in NVS
            preferences.begin("auth", false);
            preferences.putString("auth_token", payload);
            preferences.end();

            authTokenGlobal = String(payload);
            response_message = "Your device is registered successfully! You can now close this window.";
            Serial.println("Auth token stored successfully");
        }
        break;
    }

    case HTTP_CODE_BAD_REQUEST: // 400
        response_message = "We faced an internal issue. We aren't perfect but please check your email and device code once more.";
        break;

    case HTTP_CODE_UNAUTHORIZED: // 401
        response_message = "Beware of dog! Unauthorized access. Contact us if you are stuck";
        Serial.println("401 Unauthorized Error");
        break;

    case HTTP_CODE_FORBIDDEN: // 403
        response_message = "Horcrux! This is forbidden. Email us if you are stuck";
        Serial.println("403 Forbidden Error");
        break;

    case HTTP_CODE_INTERNAL_SERVER_ERROR: // 500
        response_message = "We've got 99 problems and a server issue is one of them. Try again or contact us.";
        Serial.println("500 Internal Server Error");
        break;

    case -1: // Connection failed
        response_message = "Error: Could not connect to server. Please check your internet connection.";
        Serial.println("Connection failed");
        break;

    default:
        response_message = "Error: Unexpected response (Code: " + String(httpCode) + "). Please try again or contact us..";
        Serial.printf("Unexpected HTTP code: %d\n", httpCode);
    }

    // Add error details if available
    if (httpCode != HTTP_CODE_OK)
    {
        String errorDetails = http.errorToString(httpCode);
        Serial.println("Error details: " + errorDetails);
    }

    http.end();
    return response_message;
}

// Callback function to save parameters
void saveParamsCallback()
{
    // Save the email and device code from the form
    userEmail = custom_email.getValue();
    deviceCode = custom_device_code.getValue();

    Serial.println("Saved Parameters:");
    Serial.println("Email: " + userEmail);
    Serial.println("Device Code: " + deviceCode);
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

// Function to try connecting to stored networks
bool tryConnectToStoredNetworks()
{
    wifiMulti = WiFiMulti();

    for (int i = 0; i < MAX_WIFI_NETWORKS; i++)
    {
        WifiCredential credential = loadWiFiCredentials(i);

        if (credential.isValid && !credential.ssid.isEmpty())
        {
            Serial.printf("Adding network %s to WiFiMulti\n", credential.ssid.c_str());
            addNetworkToWifiMulti(credential.ssid, credential.password);
        }
    }

    // Now attempt to connect using WiFiMulti
    Serial.println("Connecting to Wi-Fi using WiFiMulti...");
    uint32_t connectTimeoutMs = 5000; // 5 seconds timeout
    unsigned long startAttemptTime = millis();

    while (millis() - startAttemptTime < connectTimeoutMs)
    {
        if (wifiMulti.run() == WL_CONNECTED)
        {
            Serial.println("Connected to Wi-Fi!");
            Serial.print("Connected to: ");
            Serial.println(WiFi.SSID());
            Serial.print("IP Address: ");
            Serial.println(WiFi.localIP());
            return true;
        }
        delay(500); // Wait half a second before retrying
        Serial.print(".");
    }

    Serial.println("\nFailed to connect to any stored networks.");
    return false;
}

void connectWithWifiManager()
{
    // First try to connect to stored networks
    if (tryConnectToStoredNetworks())
    {
        return;
    }

    String ssid = getAPSSIDName();
    wm.setTitle("Starmoon AI");

    // Set the menu to include only "Configure WiFi"
    std::vector<const char *> menu = {"wifi"};
    wm.setMenu(menu);

    if (authTokenGlobal.isEmpty())
    {
        // Add custom parameters to WiFiManager
        wm.addParameter(&register_heading); // Add the heading between the default form and your custom fields
        wm.addParameter(&custom_email);
        wm.addParameter(&custom_device_code);

        // Set save config callback
        wm.setSaveParamsCallback(saveParamsCallback);
    }

    // Inject custom CSS and JavaScript into the /wifisave page
    String customHead = "<style>";
    customHead += ".msg { display: none; }";                                                                                                                                                                                                        // Hide default messages
    customHead += "button { background-color: #facc15; border: none; color: black; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; }"; // Change button colors
    customHead += "</style>";
    customHead += "<script>";
    customHead += "window.addEventListener('load', function() {";
    customHead += "  var savingDivs = document.querySelectorAll('.msg');"; // Select all elements with the class 'msg'
    customHead += "  if (window.location.pathname.includes('wifisave')) {";
    customHead += "      savingDivs.forEach(function(div) {";
    customHead += "        div.innerHTML = '<h4>Starmoon device connection in progress</h4>' + ";
    customHead += "        'Your device setup is in progress. If the connection fails or the device does not light up, try connecting to " + ssid + " again. <br />';";
    customHead += "        div.style.display = 'block';"; // Show the message
    customHead += "      });";
    customHead += "  } else {";                                                                           // For other cases
    customHead += "      var statusMessage = '" + getStatusMessage() + "';";                              // Get your device status message
    customHead += "      savingDivs.forEach(function(div) {";                                             // Loop through each .msg div
    customHead += "        if (statusMessage) {";                                                         // Check if there's a status message
    customHead += "          div.innerHTML = '<h4>Your device status</h4><p>' + statusMessage + '</p>';"; // Update the innerHTML with the status message
    customHead += "          div.style.display = 'block';";                                               // Ensure each div is displayed
    customHead += "        }";
    customHead += "      });";
    customHead += "  }";
    customHead += "});";
    customHead += "</script>";

    wm.setCustomHeadElement(customHead.c_str()); // Inject custom head

    wm.setBreakAfterConfig(true);   // Exit portal when Wi-Fi is connected
    wm.setConfigPortalTimeout(600); // Set timeout to 10 minutes

    if (!wm.autoConnect(ssid.c_str()))
    {
        Serial.println("Failed to connect or hit timeout");
        storeStatusMessage("Failed to connect to Wi-Fi. Please try again.");
    }
    else
    {
        Serial.println("Connected to Wi-Fi!");
        backendResponse = registerDevice(ssid);
        storeStatusMessage(backendResponse);

        // Check if auth token was not set open portal again
        if (authTokenGlobal.isEmpty())
        {
            wm.resetSettings();
        }
        else
        {
            // Store the new credentials in the next available slot
            int nextIndex = getNextStorageIndex();
            storeWiFiCredentials(wm.getWiFiSSID(), wm.getWiFiPass(), nextIndex);
        }
    }
}

void getAuthTokenFromNVS()
{
    preferences.begin("auth", false);
    authTokenGlobal = preferences.getString("auth_token", "");
    preferences.end();
}

void connectWithPassword()
{
    WiFi.begin("launchlab", "LaunchLabRocks");

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("");
    Serial.println("WiFi connected");

    WiFi.setSleep(false);
}

bool connectToWiFi()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("1. Trying to connect to WiFi...");
        getAuthTokenFromNVS();
        // connectWithWifiManager(); // Use a timeout of 10 minutes for WiFi manager
        connectWithPassword();
    }
    return WiFi.status() == WL_CONNECTED;
}

void resetDevice()
{
    wm.resetSettings();

    // clear auth NVS
    preferences.begin("auth", false);
    preferences.clear();
    preferences.end();

    // clear wifi NVS
    preferences.begin("wifi", false);
    preferences.clear();
    preferences.end();
}
