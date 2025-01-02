import asyncio
import websockets
import torch
import time
import json  # Import json module for JSON formatting

last_voice_debounce = 1
# Load the Silero VAD model
model, utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad", model="silero_vad", force_reload=False
)
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils

# Settings for the VAD
sampling_rate = 16000  # We're working directly with 16kHz audio

# Dictionary to hold connected clients and their data
connected_clients = {}


class ClientData:
    def __init__(self, websocket):
        self.websocket = websocket
        self.audio_buffer = torch.tensor([])
        self.voice = False
        self.last_voice_time = time.time()
        self.ip = websocket.remote_address[0]


async def print_voice_status():
    while True:
        status_list = []
        for client_data in connected_clients.values():
            status_list.append(f"{client_data.ip}: {client_data.voice}")
        status_str = ", ".join(status_list)
        print(f"Voice status: {status_str}")
        await asyncio.sleep(0.5)  # Print every 0.5 seconds


async def broadcast_voice_status():
    while True:
        for client_data in connected_clients.values():
            # Check if any other client has voice=True
            other_clients_voice = any(
                other_client.voice
                for other_client in connected_clients.values()
                if other_client != client_data
            )
            message = "1" if other_clients_voice else "0"
            if client_data.websocket.open:
                try:
                    await client_data.websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    pass
        await asyncio.sleep(0.5)  # Send every 0.5 seconds


async def relay_server(websocket, path):
    # Register new client
    connected_clients[websocket] = ClientData(websocket)
    client_data = connected_clients[websocket]
    print(f"Client connected: {websocket.remote_address}")

    try:
        async for message in websocket:
            if isinstance(message, bytes):
                # Message contains binary audio data, process it
                audio_chunk = (
                    torch.frombuffer(message, dtype=torch.int16).float() / 32768.0
                )
                client_data.audio_buffer = torch.cat(
                    (client_data.audio_buffer, audio_chunk)
                )

                # If we have more than 1 second of audio (16000 samples for 16kHz)
                if client_data.audio_buffer.shape[0] >= 16000:
                    # Perform VAD
                    timestamps = get_speech_timestamps(
                        client_data.audio_buffer[:16000], model, threshold=0.1
                    )

                    # Store previous voice status
                    prev_voice = client_data.voice

                    # Check if there was speech in the last second
                    if len(timestamps) > 0:
                        client_data.voice = True
                        client_data.last_voice_time = time.time()
                    else:
                        # Reset voice status if no speech detected for last_voice_debounce seconds
                        if (
                            time.time() - client_data.last_voice_time
                            > last_voice_debounce
                        ):
                            client_data.voice = False

                    # Reset the buffer
                    client_data.audio_buffer = client_data.audio_buffer[16000:]

                # Relay audio message to all other connected clients
                for other_client in connected_clients.values():
                    if (
                        other_client.websocket != websocket
                        and other_client.websocket.open
                    ):
                        try:
                            await other_client.websocket.send(message)
                        except websockets.exceptions.ConnectionClosed:
                            pass
            else:
                # Message is text, relay it to other clients
                message_str = message.strip()
                print(f"Received text message from {client_data.ip}: {message_str}")
                for other_client in connected_clients.values():
                    if (
                        other_client.websocket != websocket
                        and other_client.websocket.open
                    ):
                        try:
                            await other_client.websocket.send(message_str)
                        except websockets.exceptions.ConnectionClosed:
                            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Unregister client
        del connected_clients[websocket]
        print(f"Client disconnected: {websocket.remote_address}")


async def main():
    # Start WebSocket relay server
    server = await websockets.serve(relay_server, "0.0.0.0", 8555)
    print_task = asyncio.create_task(
        print_voice_status()
    )  # Start the voice status printing task

    # disable the broadcast voice status for now - not used in the esp32 clients
    # broadcast_task = asyncio.create_task(broadcast_voice_status())  # Start the voice status broadcasting task
    # await asyncio.gather(server.wait_closed(), print_task, broadcast_task)
    await asyncio.gather(server.wait_closed(), print_task)


if __name__ == "__main__":
    asyncio.run(main())
