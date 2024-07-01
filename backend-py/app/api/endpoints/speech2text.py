import asyncio
import json
import os
from signal import SIGINT, SIGTERM

from app.celery.tasks import analyze_text_task
from app.core.config import settings
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


async def handle_transcription(websocket: WebSocket, user_id: str):
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
                print("result+++", result)
                utterance = " ".join(is_finals)
                await websocket.send_text(f"Speech Final: {utterance}")
                # await save_transcription_to_supabase(utterance)
                print(f"User ID: {user_id}")
                is_finals = []

                # Analyze text in the background
                task = analyze_text_task.delay(utterance)
                await websocket.send_text(f"Analysis Task ID: {task.id}")
                # add task.id to metadata
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
            utterance = " ".join(is_finals)
            await websocket.send_text(f"Utterance End: {utterance}")
            # await save_transcription_to_supabase(utterance)
            is_finals = []

            # Analyze text in the background
            task = analyze_text_task.delay(utterance)
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
        endpointing=300,
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
    data = await websocket.receive_text()
    user_info = json.loads(data)
    user_id = user_info.get("user_id")
    await handle_transcription(websocket, user_id)


@router.websocket("/task_status/{task_id}")
async def task_status(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            task_result = AsyncResult(task_id)
            if task_result.ready():
                result = task_result.result
                await websocket.send_text(json.dumps(result))
                break
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected")
