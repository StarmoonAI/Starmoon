#ifndef WEBSOCKET_HANDLER_H
#define WEBSOCKET_HANDLER_H

#include <ArduinoJson.h>
#include <ArduinoWebsockets.h>

using namespace websockets;

void connectWSServer();
void onWSConnectionOpened();
void onWSConnectionClosed();
void onMessageCallback(WebsocketsMessage message);
void onEventsCallback(WebsocketsEvent event, String data);
String createAuthTokenMessage(const char *token);

extern WebsocketsClient client; // Declare WebsocketsClient globally
extern bool isWebSocketConnected;

#endif