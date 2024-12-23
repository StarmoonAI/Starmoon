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
        data_int16 = np.frombuffer(audio_data, dtype=np.int16)
        data_float32 = data_int16.astype(np.float32) / 32768.0

        # Convert numpy array to torch tensor
        audio_tensor = torch.from_numpy(data_float32)

        # Add batch and channel dimensions if needed
        if audio_tensor.dim() == 1:
            audio_tensor = audio_tensor.unsqueeze(0)  # Add batch dimension

        # Process with VAD iterator
        speech_dict = self.vad_iterator(audio_tensor, return_seconds=True)

        # Process with main VAD model
        try:
            speech_prob = model(audio_tensor, 16000).item()
            print(f"Speech probability: {speech_prob}")
            if speech_dict:

                print(f"Speech dict: {speech_dict}")
        except Exception as e:
            print(f"Error processing audio with VAD model: {str(e)}")

        # only the threshold is over 0,5 and the volume is over the current volume

        return audio_data
