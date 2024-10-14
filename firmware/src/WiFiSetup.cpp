#include "WiFiSetup.h"
#include "Config.h"

WiFiManager wm;

void simpleAPSetup()
{
    wm.setTitle("Starmoon AI");

    // Set the menu to include only "Configure WiFi"
    std::vector<const char *> menu = {"wifi"};
    wm.setMenu(menu);

    // Inject custom CSS and HTML
    String customHead = "<style>.msg { display: none; } h2 { display: none; }</style>";
    wm.setCustomHeadElement(customHead.c_str());

    String customHTML = "<h1 style='text-align:center;'>Starmoon AI</h1>";
    wm.setCustomMenuHTML(customHTML.c_str());

    if (!wm.autoConnect("Starmoon AI device"))
    {
        Serial.println("Failed to connect or hit timeout");
        ESP.restart();
    }

    Serial.println("Connected to Wi-Fi!");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}

void connectWiFi()
{
    WiFi.disconnect(true);
    WiFi.mode(WIFI_STA);
    // use this for personal networks
    WiFi.begin(ssid_peronal, password_personal);
    // use this for enterprise networks
    // WiFi.begin(ssid, WPA2_AUTH_PEAP, EAP_IDENTITY, EAP_USERNAME, EAP_PASSWORD);

    Serial.println("Connecting to WiFi");
    Serial.println("");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("\nWiFi connected");
    WiFi.setSleep(false);
}
