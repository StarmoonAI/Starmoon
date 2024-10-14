#include "I2SHandler.h"
#include "Config.h"
#include "WebSocketHandler.h"

void i2s_install_mic()
{
    const i2s_config_t i2s_config = {
        .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE, // Explicit cast to uint32_t
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
        esp_err_t result = i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len, &bytes_read, portMAX_DELAY);

        if (result == ESP_OK && isWebSocketConnected)
        {
            // Apply scaling to the read data
            i2s_adc_data_scale(flash_write_buff, (uint8_t *)i2s_read_buff, i2s_read_len);
            client.sendBinary((const char *)flash_write_buff, i2s_read_len);
            // ets_printf("Never Used Stack Size: %u\n", uxTaskGetStackHighWaterMark(NULL));
        }
    }

    free(i2s_read_buff);
    i2s_read_buff = NULL;
    free(flash_write_buff);
    flash_write_buff = NULL;
    // vTaskDelete(NULL);
}

// void micTask(void *parameter)
// {
//     i2s_install_mic();
//     i2s_setpin_mic();
//     i2s_start(I2S_PORT_IN);

//     size_t bytesIn = 0;
//     uint8_t sBuffer[I2S_READ_LEN];
//     uint8_t scaledBuffer[I2S_READ_LEN];

//     while (1)
//     {
//         esp_err_t result = i2s_read(I2S_PORT_IN, sBuffer, I2S_READ_LEN, &bytesIn, portMAX_DELAY);

//         if (result == ESP_OK && isWebSocketConnected)
//         {
//             // Apply scaling to the read data
//             i2s_adc_data_scale(scaledBuffer, sBuffer, bytesIn);
//             // Send the scaled data
//             client.sendBinary((const char *)scaledBuffer, bytesIn);
//             ets_printf("Never Used Stack Size: %u\n", uxTaskGetStackHighWaterMark(NULL));
//         }
//     }

//     vTaskDelete(NULL);
// }