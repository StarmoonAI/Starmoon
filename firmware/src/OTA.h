#ifndef OTA_H
#define OTA_H
#include "Config.h"

extern const char *server_certificate;
extern const char *ota_firmware_url;
void performOTAUpdate();
void OTA_status();
void setOTAStatusInNVS(bool status);
void getOTAStatusFromNVS();

#endif