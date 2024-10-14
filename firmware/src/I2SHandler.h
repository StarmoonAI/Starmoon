#ifndef I2S_HANDLER_H
#define I2S_HANDLER_H

#include <driver/i2s.h>

void i2s_install_mic();
void i2s_setpin_mic();
void i2s_install_speaker();
void i2s_setpin_speaker();
void micTask(void *parameter);

#endif
