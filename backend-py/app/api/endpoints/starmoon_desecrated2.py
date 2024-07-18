import asyncio
import json
import os
import re
import time
import uuid
from signal import SIGINT, SIGTERM

import azure.cognitiveservices.speech as speechsdk
import diart.models as m
import emoji
import numpy as np
import openai
import requests
import torch
from app.core.auth import authenticate_user, validate_db
from app.core.config import settings
from app.prompt.sys_prompt import SYS_PROMPT_PREFIX
from app.services.clients import Clients
from azure.cognitiveservices.speech import (
    AudioDataStream,
    SpeechConfig,
    SpeechSynthesizer,
)
from azure.cognitiveservices.speech.audio import AudioOutputConfig
from celery.result import AsyncResult
from deepgram import (
    AnalyzeOptions,
    DeepgramClient,
    DeepgramClientOptions,
    LiveOptions,
    LiveTranscriptionEvents,
    TextSource,
)
from diart import SpeakerDiarization, SpeakerDiarizationConfig, VoiceActivityDetection
from diart.inference import StreamingInference
from diart.models import EmbeddingModel
from diart.sources import WebSocketAudioSource
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

torch.set_num_threads(1)
load_dotenv()
router = APIRouter()
client = Clients()
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = (
    settings.silero_vad_utils
)
model = settings.silero_vad_model
speech_config = SpeechConfig(
    subscription="d9e1868008cf477eb9cad5ddca6e4994", region="eastus"
)
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)


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


class TranscriptCollector:
    def __init__(self):
        self.reset()

    def reset(self):
        self.transcript_parts = []

    def add_part(self, part):
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        return " ".join(self.transcript_parts)


transcript_collector = TranscriptCollector()
manager = ConnectionManager()


async def get_transcript(websocket: WebSocket, callback):
    transcription_complete = asyncio.Event()  # Event to signal transcription completion
    try:
        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram = DeepgramClient(os.getenv("DG_API_KEY"), config)

        dg_connection = deepgram.listen.asynclive.v("1")
        print("Listening...")

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript
            print(sentence)
            if not result.speech_final:
                transcript_collector.add_part(sentence)
            else:
                # This is the final part of the current sentence
                transcript_collector.add_part(sentence)
                full_sentence = transcript_collector.get_full_transcript()
                # Check if the full_sentence is not empty before printing
                if len(full_sentence.strip()) > 0:
                    full_sentence = full_sentence.strip()
                    print(f"Human: {full_sentence}")
                    callback(full_sentence)  # Call the callback with the full_sentence
                    transcript_collector.reset()
                    transcription_complete.set()  # Signal to stop transcription and exit

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)

        options = LiveOptions(
            model="nova-2",
            punctuate=True,
            language="en-US",
            smart_format=True,
            encoding="linear16",
            # channels=1,
            multichannel=True,
            sample_rate=16000,
            # interim_results=True,
            # utterance_end_ms="1500",
            vad_events=True,
            endpointing=300,
            filler_words=True,
            numerals=True,
            diarize=True,
        )

        addons = {"no_delay": "true"}

        if await dg_connection.start(options, addons=addons) is False:
            await websocket.send_text("Failed to connect to Deepgram")
            return

        try:
            while True:
                data = await websocket.receive_bytes()
                await dg_connection.send(data)
        except WebSocketDisconnect:
            await dg_connection.finish()

        await transcription_complete.wait()
        await dg_connection.finish()

    except Exception as e:
        print(f"Could not open Websocket: {e}")
        return


def handle_full_sentence(full_sentence):
    print(f"Full sentence: {full_sentence}")


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # while True:
        # source = WebSocketAudioSource(pipeline.config.sample_rate, websocket)
        # inference = StreamingInference(pipeline, source)
        # print("Starting inference", inference)

        # audio_data = await websocket.receive_bytes()
        # print(f"Received {len(audio_data)} bytes")
        await get_transcript(websocket, handle_full_sentence)

        # response = await manager.process_audio(audio_data)
        # await websocket.send_bytes(response)
        # print(f"Sent {len(response)} bytes")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in websocket_endpoint: {e}")
        manager.disconnect(websocket)
