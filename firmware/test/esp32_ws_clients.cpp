#include <Arduino.h>
#include "AudioTools.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Settings.h>  // Include your settings (SSID, password, server details)
#include <SD.h>
#include <SPI.h>

// Audio Settings
AudioInfo from(16000, 1, 32);  // Input audio format
AudioInfo to(16000, 1, 16);    // Output audio format
AudioInfo volumeconfig(16000, 1, 16);    // Output audio format
// I2S Input Stream (Microphone)
I2SStream in;
FormatConverterStream conv(in);
VolumeStream volume(conv);

// I2S Output Stream (Speaker)
I2SStream i2sStream;

// WebSocket Client
WebSocketsClient webSocket;

// Audio buffer for streaming
const size_t bufferSize = 256;  // 256 samples of int16_t
int16_t audioBuffer[bufferSize];

// SD Card and WAV playback
WAVDecoder wav;
EncodedAudioOutput decoder(&i2sStream, &wav);  // Decoding stream
StreamCopy copier;
File audioFile;

// Button handling
const int buttonPin = 15;        // GPIO pin connected to the button
bool buttonState = HIGH;         // Current reading from the input pin
bool lastButtonState = HIGH;     // Previous reading from the input pin
unsigned long lastDebounceTime = 0;  // Last time the button state changed
unsigned long debounceDelay = 50;    // Debounce time in milliseconds

// State Machine
enum State { IDLE, RINGING, ACTIVECALL };
State currentState = IDLE;

// Sound Types
enum SoundType { NONE, RINGING_SOUND, ACCEPT_SOUND };
SoundType currentSound = NONE;
bool isPlaying = false;

// Flags
bool isStreaming = false;
bool isWebSocketConnected = false;
bool isCaller = false;  // Flag to indicate if this device is the caller

// Function to connect to Wi-Fi
void connectWifi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to Wi-Fi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Optional: Disable Wi-Fi power save for better performance
  esp_wifi_set_ps(WIFI_PS_NONE);
}

// Function to start playback of a WAV file
void startPlayback(const char* filename) {
  audioFile = SD.open(filename);
  if (!audioFile) {
    Serial.print("Failed to open audio file ");
    Serial.println(filename);
    return;
  }
  // Start decoder and copier
  decoder.begin();
  copier.begin(decoder, audioFile);
  isPlaying = true;

  if (strcmp(filename, "/ringingsound.wav") == 0) {
    currentSound = RINGING_SOUND;
  } else if (strcmp(filename, "/acceptsound.wav") == 0) {
    currentSound = ACCEPT_SOUND;
  } else {
    currentSound = NONE;
  }

  Serial.print("Playback started: ");
  Serial.println(filename);
}

// Function to stop playback
void stopPlayback() {
  // Stop decoder and copier
  copier.end();
  decoder.end();
  audioFile.close();
  isPlaying = false;
  currentSound = NONE;
  Serial.println("Playback stopped");
}

// Function to initialize SD card
void setupSDCard() {
  Serial.println("Initializing SD card...");
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS)) {
    Serial.println("SD card initialization failed!");
    while (1) {
      delay(1000); // Stay here if SD card initialization fails
    }
  }
  Serial.println("SD card initialized.");
}

// Button handling with debounce logic
void checkButton() {
  int reading = digitalRead(buttonPin);

  if (reading != lastButtonState) {
    lastDebounceTime = millis();  // Reset the debouncing timer
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    // If the button state has changed
    if (reading != buttonState) {
      buttonState = reading;

      // Only act on the button press when it goes LOW (button pressed)
      if (buttonState == LOW) {
        if (currentState == IDLE) {
          // Send "RINGING" message
          if (isWebSocketConnected) {
            webSocket.sendTXT("RINGING");
            currentState = RINGING;
            isCaller = true; // This device is the caller
            startPlayback("/ringingsound.wav");
          }
        } else if (currentState == RINGING) {
          if (isCaller) {
            // Caller cancels the call
            if (isWebSocketConnected) {
              webSocket.sendTXT("ABORT");
              stopPlayback();
              currentState = IDLE;
            }
          } else {
            // Callee accepts the call
            if (isWebSocketConnected) {
              webSocket.sendTXT("ACCEPT");
              stopPlayback();
              startPlayback("/acceptsound.wav");
              currentState = ACTIVECALL;
              isStreaming = true;
            }
          }
        } else if (currentState == ACTIVECALL) {
          // Send "ABORT" message
          if (isWebSocketConnected) {
            webSocket.sendTXT("ABORT");
            isStreaming = false;
            startPlayback("/acceptsound.wav"); // Play accept sound when aborting call
            currentState = IDLE;
          }
        }
      }
    }
  }
  lastButtonState = reading;
}

// WebSocket Event Handler
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected!");
      isWebSocketConnected = false;
      break;

    case WStype_CONNECTED:
      Serial.println("WebSocket Connected!");
      isWebSocketConnected = true;
      break;

    case WStype_BIN: {
      if (currentState == ACTIVECALL) {
        // Write the received audio data to the I2S output
        size_t bytesWritten = i2sStream.write(payload, length);
        if (bytesWritten != length) {
          Serial.printf("Error: Expected to write %u bytes, but wrote %u bytes\n", length, bytesWritten);
        }
      }
      break;
    }

    case WStype_TEXT: {
      String message = String((char*)payload);
      Serial.printf("Received message: %s\n", message.c_str());

      if (message == "RINGING") {
        if (currentState == IDLE) {
          currentState = RINGING;
          isCaller = false; // This device is being called
          startPlayback("/ringingsound.wav");
        }
      } else if (message == "ACCEPT") {
        if (currentState == RINGING) {
          stopPlayback();
          startPlayback("/acceptsound.wav");
          currentState = ACTIVECALL;
          isStreaming = true;
        }
      } else if (message == "ABORT") {
        if (currentState == ACTIVECALL) {
          stopPlayback();
          startPlayback("/acceptsound.wav"); // Play accept sound when call is aborted
          currentState = IDLE;
          isStreaming = false;
        } else if (currentState == RINGING) {
          stopPlayback();
          currentState = IDLE;
          isStreaming = false;
        }
      }
      break;
    }

    case WStype_ERROR:
      Serial.println("WebSocket Error!");
      break;

    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  AudioLogger::instance().begin(Serial, AudioLogger::Info);

  // Initialize button
  pinMode(buttonPin, INPUT_PULLUP);  // Set pin as INPUT_PULLUP for the button

  // Initialize SD card
  setupSDCard();

  // Connect to Wi-Fi
  connectWifi();

  // Initialize WebSocket client
  webSocket.begin(serverAddress, port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);

  // Initialize I2S input (Microphone)
  Serial.println("Initializing I2S input...");
  auto config_in = in.defaultConfig(RX_MODE);
  config_in.sample_rate = from.sample_rate;
  config_in.bits_per_sample = from.bits_per_sample;
  config_in.channels = from.channels;
  config_in.pin_bck = AUDIO_MIC_SCK;   // Bit Clock (BCLK) pin
  config_in.pin_ws = AUDIO_MIC_WS;     // Word Select (LRCLK) pin
  config_in.pin_data = AUDIO_MIC_SD;   // Serial Data In (DOUT) pin
  config_in.port_no = I2S_NUM_0;
  in.begin(config_in);
  conv.begin(from, to);
  

  auto vol_config = volume.defaultConfig();
  vol_config.volume = 10;
  vol_config.allow_boost = true;

  volume.begin(vol_config);  



  // Initialize I2S output (Speaker)
  Serial.println("Initializing I2S output...");
  auto config_out = i2sStream.defaultConfig(TX_MODE);
  config_out.sample_rate = to.sample_rate;
  config_out.bits_per_sample = to.bits_per_sample;
  config_out.channels = to.channels;
  config_out.buffer_size = 512;
  config_out.buffer_count = 6;
  config_out.pin_bck = AUDIO_SPEAKER_BCLK;  // Bit Clock pin
  config_out.pin_ws = AUDIO_SPEAKER_LRC;    // Word Select pin
  config_out.pin_data = AUDIO_SPEAKER_DIN;  // Serial Data Out pin
  config_out.port_no = I2S_NUM_1;
  i2sStream.begin(config_out);

  Serial.println("Setup complete.");
}

void loop() {
  // Handle WebSocket communication
  webSocket.loop();

  // Check button state
  checkButton();

  // Handle playback
  if (isPlaying) {
    if (!copier.copy()) {
      // Playback finished
      stopPlayback();
      if (currentState == RINGING && currentSound == RINGING_SOUND) {
        // Loop the ringing sound
        startPlayback("/ringingsound.wav");
      } else if (currentState == ACTIVECALL && currentSound == ACCEPT_SOUND) {
        // Continue as per state
        currentSound = NONE;
      } else if (currentState == IDLE && currentSound == ACCEPT_SOUND) {
        // After aborting the call and playing accept sound
        currentSound = NONE;
      } else {
        currentSound = NONE;
      }
    }
  }

  // Handle audio streaming
  if (isStreaming && currentState == ACTIVECALL && isWebSocketConnected) {
    // Read audio data from the microphone
    size_t bytesGenerated = volume.readBytes((uint8_t*)audioBuffer, sizeof(audioBuffer));

    // Send the audio data over WebSocket
    webSocket.sendBIN((uint8_t*)audioBuffer, bytesGenerated);
  }
}
