import asyncio
import websockets
import pyaudio
import json
import base64

# Audio configuration
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000

class AudioClient:
    def __init__(self, uri):
        self.uri = uri
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(format=FORMAT,
                                  channels=CHANNELS,
                                  rate=RATE,
                                  input=True,
                                  frames_per_buffer=CHUNK)

    async def connect(self):
        self.websocket = await websockets.connect(self.uri)
        print(f"Connected to {self.uri}")

    async def send_auth(self):
        auth_token = "your_auth_token_here"
        auth_message = json.dumps({"token": auth_token})
        await self.websocket.send(auth_message)
        print("Sent authentication token")

    async def send_audio(self):
        print("Starting to send audio. Press Ctrl+C to stop.")
        try:
            while True:
                data = self.stream.read(CHUNK)
                await self.websocket.send(data)
                print(f"Sent {len(data)} bytes of audio data")
                await asyncio.sleep(0.01)  # Small delay to prevent flooding
        except KeyboardInterrupt:
            print("Stopping audio transmission")

    async def run(self):
        await self.connect()
        await self.send_auth()
        await self.send_audio()

    def close(self):
        self.stream.stop_stream()
        self.stream.close()
        self.p.terminate()

async def main():
    server_uri = "ws://localhost:8000"  # Change this to your server's IP if needed
    client = AudioClient(server_uri)
    try:
        await client.run()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())