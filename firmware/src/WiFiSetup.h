#ifndef WIFI_SETUP_H
#define WIFI_SETUP_H

#include "Config.h"
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiManager.h> // Include WiFiManager
#include <WebServer.h>
#include <HTTPClient.h>
#include <Preferences.h>

extern Preferences preferences; // Initialize preferences
extern WebServer server;        // Initialize server on port 80
extern String authTokenGlobal;
extern WiFiMulti wifiMulti;

// Buffers for custom parameters
extern String userEmail;
extern String deviceCode;
extern String backendResponse;

// void connectWiFi();          // Declare the WiFi connection function
void connectWithWifiManager(); // Declare the simple AP setup function
String registerDevice();       // Declare the device registration function
void getAuthTokenFromNVS();    // Declare the function to get the auth token from NVS
void saveParamsCallback();

// Structure to hold WiFi credentials
struct WifiCredential
{
    String ssid;
    String password;
    bool isValid;
};

void storeWiFiCredentials(const String &ssid, const String &password, int index);
WifiCredential loadWiFiCredentials(int index);
int getNextStorageIndex();
WifiCredential *getAllStoredNetworks();
void printStoredNetworks();

bool connectToWiFi(); // Declare the WiFi connection function
void resetDevice();
void connectWithPassword();

#endif
