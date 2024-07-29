import asyncio
import websockets
import pyaudio

# Audio configuration
SAMPLE_RATE = 44100
SAMPLE_FORMAT = pyaudio.paInt16
CHANNELS = 1
BUFFER_SIZE = 1024

# Initialize PyAudio
audio = pyaudio.PyAudio()
stream = audio.open(format=SAMPLE_FORMAT,
                    channels=CHANNELS,
                    rate=SAMPLE_RATE,
                    output=True,
                    frames_per_buffer=BUFFER_SIZE)

async def audio_handler(websocket, path):
    print("Client connected")
    try:
        async for message in websocket:
            stream.write(message)
            print(f"Received {len(message)} bytes of audio data")
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        stream.stop_stream()
        stream.close()
        audio.terminate()

start_server = websockets.serve(audio_handler, "0.0.0.0", 8000)

asyncio.get_event_loop().run_until_complete(start_server)
print("WebSocket server started on ws://0.0.0.0:8000")
asyncio.get_event_loop().run_forever()
