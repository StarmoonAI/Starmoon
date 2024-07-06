import asyncio
import json
import os
import re
import uuid
from signal import SIGINT, SIGTERM

import azure.cognitiveservices.speech as speechsdk
import emoji
import openai
from app.celery.tasks import analyze_text_task
from app.core.auth import authenticate_user
from app.core.config import settings
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
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from litellm import transcription

load_dotenv()
router = APIRouter()
is_finals = []

client = Clients()

speech_config = SpeechConfig(
    subscription="d9e1868008cf477eb9cad5ddca6e4994", region="eastus"
)


async def speech_stream_response(text: str, websocket: WebSocket):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.start_speaking_text_async(text).get()
    audio_data_stream = speechsdk.AudioDataStream(result)
    audio_buffer = bytes(32000)
    filled_size = audio_data_stream.read_data(audio_buffer)
    while filled_size > 0:
        await websocket.send_bytes(audio_buffer[:filled_size])
        filled_size = audio_data_stream.read_data(audio_buffer)
    speech_synthesizer.stop_speaking_async()


async def speech_stream_response_azure(transcription: dict, websocket: WebSocket):
    completion = client.client_azure_4o.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are an emotional care assistant, please respond to users in a chat-like manner.",
            },
            {"role": "user", "content": transcription["transcription"]},
        ],
        stream=True,
    )

    accumulated_text = ""
    for chunk in completion:
        if len(chunk.choices) > 0:
            chunk_text = chunk.choices[0].delta.content
            if chunk_text:
                chunk_text = emoji.replace_emoji(chunk_text, replace="")
                accumulated_text += chunk_text
                sentences = re.split("(?<=[.。!?]) +", accumulated_text)
                # If we have more than one sentence, send all but the last
                if len(sentences) > 1:
                    for sentence in sentences[:-1]:
                        if sentence:
                            print("++++", sentence)
                            await websocket.send_json(
                                {
                                    "response": sentence.strip(),
                                    "is_running": True,
                                }
                            )
                            await asyncio.sleep(0)
                            await speech_stream_response(sentence.strip(), websocket)
                    # Keep the last (possibly incomplete) sentence
                    accumulated_text = sentences[-1]
    # Send any remaining text
    if accumulated_text:
        await websocket.send_json(
            {"response": accumulated_text.strip(), "is_running": True}
        )
        await asyncio.sleep(0)
        await speech_stream_response(accumulated_text.strip(), websocket)
        await asyncio.sleep(0)
    await websocket.send_json({"response": "", "is_running": False})


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # authenticate
        token = await websocket.receive_text()
        # user = authenticate_user(token)
        while True:
            # Receive message from the client
            transcription = await websocket.receive_json()
            print(transcription)

            await speech_stream_response_azure(transcription, websocket)

    except WebSocketDisconnect:
        print("Client disconnected")
