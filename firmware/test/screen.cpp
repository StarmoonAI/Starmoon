#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <LGFX_AUTODETECT.hpp> // Autodetect board
#include <LovyanGFX.hpp>

class LGFX : public lgfx::LGFX_Device
{
    lgfx::Panel_GC9A01 _panel_instance;
    lgfx::Bus_SPI _bus_instance;

public:
    LGFX(void)
    {
        {
            auto cfg = _bus_instance.config();
            cfg.spi_host = SPI2_HOST;
            cfg.spi_mode = 0;
            cfg.freq_write = 40000000;
            cfg.pin_sclk = D5; // SCL
            cfg.pin_mosi = D4; // SDA
            cfg.pin_miso = -1;
            cfg.pin_dc = D2; // DC
            _bus_instance.config(cfg);
            _panel_instance.setBus(&_bus_instance);
        }

        {
            auto cfg = _panel_instance.config();
            cfg.pin_cs = D1;  // CS
            cfg.pin_rst = D0; // RST
            cfg.pin_busy = -1;
            cfg.panel_width = 240;
            cfg.panel_height = 240;
            cfg.offset_x = 0;
            cfg.offset_y = 0;
            cfg.offset_rotation = 0;
            cfg.dummy_read_pixel = 8;
            cfg.dummy_read_bits = 1;
            cfg.readable = false;
            cfg.invert = true;
            cfg.rgb_order = false;
            cfg.dlen_16bit = false;
            cfg.bus_shared = true;

            _panel_instance.config(cfg);
        }

        setPanel(&_panel_instance);
    }
};

LGFX tft;

void setup()
{
    Serial.begin(115200);

    tft.init();
    tft.setRotation(0);
    tft.setBrightness(128);
    tft.fillScreen(TFT_BLACK);

    tft.setTextColor(TFT_WHITE);
    tft.setTextSize(2);
    tft.setCursor(10, 10);
    tft.println("Hello, ESP32-S3!");
    tft.println("XIAO TFT Test");

    tft.drawRect(10, 60, 100, 80, TFT_GREEN);
    tft.fillCircle(180, 100, 30, TFT_BLUE);
}

void loop()
{
    // Your main code here, if needed
}