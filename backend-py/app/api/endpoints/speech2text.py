import asyncio
import json
import os
import uuid
from signal import SIGINT, SIGTERM

import azure.cognitiveservices.speech as speechsdk
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

load_dotenv()

router = APIRouter()
is_finals = []

client = Clients()

speech_config = SpeechConfig(
    subscription="d9e1868008cf477eb9cad5ddca6e4994", region="eastus"
)


async def stream_tts(text: str, websocket: WebSocket):
    synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=None)
    result = synthesizer.start_speaking_text_async(text)

    audio_data_stream = AudioDataStream(result)

    buffer = bytes(32000)
    while True:
        num_bytes = audio_data_stream.read_data(buffer)
        if num_bytes == 0:
            break
        await websocket.send_text(buffer[:num_bytes])

    synthesizer.stop_speaking_async()


async def process_and_stream_response(utterance: str, websocket: WebSocket):
    # Get streaming response from OpenAI
    async for chunk in client.client_azure_4o.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": utterance},
        ],
        stream=True,
    ):
        if chunk.choices[0].delta.get("content"):
            content = chunk.choices[0].delta.content
            await websocket.send_json({"type": "text_response", "content": content})

            # Stream TTS audio
            await stream_tts(content, websocket)


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
    #     print("{} bytes received.".format(filled_size))
    #     filled_size = audio_data_stream.read_data(audio_buffer)
    #     # send audio data to the client
    #     await websocket(audio_buffer[:filled_size])
    # speech_synthesizer.stop_speaking_async()


async def handle_transcription(websocket: WebSocket, user_id: str, session_id: str):
    config = DeepgramClientOptions(options={"keepalive": "true"})
    deepgram = DeepgramClient(os.getenv("DG_API_KEY"), config)
    dg_connection = deepgram.listen.asynclive.v("1")

    async def on_open(self, open, **kwargs):
        print(f"Connection Open")

    async def on_message(self, result, **kwargs):
        global is_finals
        sentence = result.channel.alternatives[0].transcript
        if len(sentence) == 0:
            return
        if result.is_final:
            is_finals.append(sentence)
            if result.speech_final:
                transcription_id = str(uuid.uuid4())

                # print("result+++", result)
                utterance = " ".join(is_finals)
                await websocket.send_json(
                    {
                        "transcription_id": transcription_id,
                        "speech_final": utterance,
                    }
                )
                # await save_transcription_to_supabase(utterance)
                print(f"User ID: {user_id}")
                is_finals = []

                await speech_stream_response(utterance, websocket)

                # Analyze text in the background
                task = analyze_text_task.delay(utterance, transcription_id)
                await websocket.send_text(f"Analysis Task ID: {task.id}")

            # else:
            #     await websocket.send_text(f"Is Final: {sentence}")
        # else:
        #     await websocket.send_text(f"Interim Results: {sentence}")

    async def on_metadata(self, metadata, **kwargs):
        await websocket.send_text(f"Metadata: {metadata}")

    async def on_speech_started(self, speech_started, **kwargs):
        await websocket.send_text(f"Speech Started")

    async def on_utterance_end(self, utterance_end, **kwargs):
        global is_finals
        if len(is_finals) > 0:
            transcription_id = str(uuid.uuid4())
            utterance = " ".join(is_finals)
            await websocket.send_json(
                {
                    "transcription_id": transcription_id,
                    "utterance_end": utterance,
                }
            )
            # await save_transcription_to_supabase(utterance)
            is_finals = []

            await speech_stream_response(utterance, websocket)

            # Analyze text in the background
            task = analyze_text_task.delay(utterance, transcription_id)
            await websocket.send_text(f"Analysis Task ID: {task.id}")

    async def on_close(self, close, **kwargs):
        await websocket.send_text(f"Connection Closed")

    async def on_error(self, error, **kwargs):
        await websocket.send_text(f"Handled Error: {error}")

    async def on_unhandled(self, unhandled, **kwargs):
        await websocket.send_text(f"Unhandled Websocket Message: {unhandled}")

    dg_connection.on(LiveTranscriptionEvents.Open, on_open)
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
    dg_connection.on(LiveTranscriptionEvents.Metadata, on_metadata)
    dg_connection.on(LiveTranscriptionEvents.SpeechStarted, on_speech_started)
    dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)
    dg_connection.on(LiveTranscriptionEvents.Close, on_close)
    dg_connection.on(LiveTranscriptionEvents.Error, on_error)
    dg_connection.on(LiveTranscriptionEvents.Unhandled, on_unhandled)

    options = LiveOptions(
        model="nova-2",
        language="en-US",
        smart_format=True,
        encoding="linear16",
        # channels=1,
        multichannel=True,
        sample_rate=16000,
        interim_results=True,
        utterance_end_ms="1500",
        vad_events=True,
        endpointing=500,
        filler_words=True,
        numerals=True,
        diarize=True,
        # diarize=True,
        # dictation=True,
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


@router.websocket("/speech2text")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        user_info = json.loads(data)
        token = user_info.get("token")

        # Authenticate the user
        username = await authenticate_user(token)
        print("username1", username)
        # if username not in the supabase
        if not username:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        user_id = user_info.get("user_id")
        session_id = user_info.get("session_id")
        await handle_transcription(websocket, user_id, session_id)

    except WebSocketDisconnect:
        print("Client disconnected")


@router.websocket("/task_status/{task_id}")
async def task_status(websocket: WebSocket, task_id: str):
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        user_info = json.loads(data)
        token = user_info.get("token")

        # Authenticate the user
        username = await authenticate_user(token)
        print("username2", username)
        if not username:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        while True:
            task_result = AsyncResult(task_id)
            if task_result.ready():
                result = task_result.result
                await websocket.send_text(json.dumps(result))
                break
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("Client disconnected")
