import numpy as np
import torch
from app.core.config import settings
from fastapi import WebSocket

torch.set_num_threads(1)
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = (
    settings.silero_vad_utils
)
model = settings.silero_vad_model


class ConnectionManager:
    def __init__(self):
        self.active_connections = []
        self.vad_iterator = VADIterator(model)
        self.speech_buffer = []
        self.silence_duration = 0
        self.is_speaking = False
        self.interrupt_threshold = 0.3  # seconds

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New connection. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Connection closed. Total connections: {len(self.active_connections)}")

    async def process_audio(self, audio_data):
        # Process the audio data here (e.g., speech recognition)
        # For this example, we'll just echo back the audio data
        # print("Received audio data from client")

        # Convert bytes to float32 numpy array
        audio_np = np.frombuffer(audio_data, dtype=np.float32)
        speech_prob = self.vad_iterator(audio_np, 16000)
        print(f"Speech probability: {speech_prob}")

        return audio_data
