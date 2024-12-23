import asyncio
import base64
import json
import os
import re
import traceback
from io import BytesIO
from math import e

import azure.cognitiveservices.speech as speechsdk
import emoji
import nltk
import ormsgpack
import websockets
from app.celery.tasks import emotion_detection
from app.core.config import settings
from app.services.clients import Clients
from app.utils.enqueue import enqueue_bytes, enqueue_task
from app.utils.sentence_splitter import chunk_text_by_clause

# from app.services.fish_speech import voice_clone
from azure.cognitiveservices.speech import SpeechConfig
from celery.result import AsyncResult
from dotenv import load_dotenv
from fastapi import WebSocket
from fish_audio_sdk import ReferenceAudio, Session, TTSRequest
from pydub import AudioSegment

load_dotenv()


SPEECH_KEY = settings.SPEECH_KEY
SPEECH_REGION = settings.SPEECH_REGION
speech_config = SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)


def create_emotion_detection_task(
    utterance: str,
    user: dict,
    personality_translation: dict,
    role: str,
    session_id: str,
    is_sensitive: bool = False,
):
    # send utterance to celery task
    celery_task = emotion_detection.delay(
        utterance, user, personality_translation, role, session_id, is_sensitive
    )
    task_id = celery_task.id

    return task_id


async def check_task_result(task_id: str, websocket: WebSocket):
    celery_task = AsyncResult(task_id)

    while not celery_task.ready():
        await asyncio.sleep(0.5)  # Wait for 1 second before checking again

    result = celery_task.result

    if isinstance(result, Exception):
        result = {
            "error": str(result),
            "traceback": traceback.format_exception_only(type(result), result),
        }

    await websocket.send_json(
        {
            "type": "task",
            "audio_data": None,
            "text_data": result,
            "boundary": None,
            "task_id": task_id,
        }
    )


def azure_voice_systhesizer(
    text: str,
    language: str = "en-US",
    voice_name: str = "en-US-Ava:DragonHDLatestNeural",
    emotion: str = "",
    emotion_degree: float = 0,  # default
    emotion_role: str = None,
    rate: float = 0,
    pitch: float = 0,
):
    # https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice

    ssml = f"""<speak version='1.0' xml:lang="{language}" xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
    <voice name="{voice_name}">
        <mstts:express-as style="{emotion}" styledegree="{emotion_degree}">
            <prosody rate="{rate}%" pitch="{pitch}%">
                {text}
            </prosody>
        </mstts:express-as>
    </voice>
    </speak>"""

    return ssml


def azure_speech_response(ssml: str):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.speak_ssml_async(ssml).get()
    # send response back to the client
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # await websocket.send_bytes(result.audio_data)
        return result

    return None


def azure_tts_legacy(
    sentence: str,
    boundary: str,
    task_id: str,
    tts_code: str,
    device: str,
    bytes_queue: asyncio.Queue,
):
    print("sentence+++", sentence)

    text_tone = azure_voice_systhesizer(
        text=sentence.strip(),
        voice_name=tts_code,
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )

    result = azure_speech_response(text_tone)
    print("result++++++++", result)

    # Send the JSON object over the WebSocket connection
    if device == "web":
        audio_data_base64 = base64.b64encode(result.audio_data).decode("utf-8")
        bytes_queue.put_nowait(
            {
                "type": "json",
                "device": device,
                "data": {
                    "type": "response",
                    "audio_data": audio_data_base64,
                    "text_data": sentence,
                    "boundary": boundary,
                    "task_id": task_id,
                },
            }
        )
    else:
        chunk_size = 1024  # Adjust this value based on your needs
        max_len = len(result.audio_data)
        if max_len > 100:
            audio_data = result.audio_data[100:]
        else:
            audio_data = result.audio_data
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            # print("Audio chunk+++++++++", i)
            bytes_queue.put_nowait(
                {"type": "bytes", "device": device, "data": chunk, "id": i}
            )


def azure_tts(
    sentence: str,
    is_start: bool,
    task_id_queue: asyncio.Queue,
    tts_code: str,
    device: str,
    bytes_queue: asyncio.Queue,
    user: dict,
    personality_translation: dict,
):

    task_id = create_emotion_detection_task(
        f"{sentence}",
        user,
        personality_translation,
        "assistant",
        user["most_recent_chat_group_id"],
    )

    text_tone = azure_voice_systhesizer(
        text=sentence.strip(),
        voice_name=tts_code,
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )

    result = azure_speech_response(text_tone)

    sample_rate = 16000
    sample_width = 2  # bytes per sample for 16-bit audio
    channels = 1

    audio_data = result.audio_data[100:]

    audio_segment = AudioSegment(
        data=audio_data,
        sample_width=sample_width,
        frame_rate=sample_rate,
        channels=channels,
    )
    # decrease the volume by 10dB (-10-40)
    audio_segment = audio_segment + 20
    resampled_segment = audio_segment.set_frame_rate(16000)
    audio_data = resampled_segment.raw_data

    if is_start:
        enqueue_bytes(bytes_queue, device, "info", None, "START", "START")

    if device == "web":
        base64_audio = base64.b64encode(audio_data).decode("utf-8")
        enqueue_bytes(
            bytes_queue, device, "response", base64_audio, sentence, None, task_id
        )
        enqueue_task(task_id_queue, task_id)
    else:
        chunk_size = 1024  # Adjust this value based on your needs
        max_len = len(audio_data)
        if max_len > 100:
            audio_data = audio_data
        else:
            audio_data = audio_data
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            # if i is 100th, send the sentence
            # print("Audio chunk+++++++++", i)
            if i % 500 == 0:
                enqueue_bytes(bytes_queue, device, "gap", None, None, None, None)

            enqueue_bytes(
                bytes_queue, device, "response", chunk, sentence, None, task_id
            )


def fish_tts(
    sentence: str,
    is_start: bool,
    task_id_queue: asyncio.Queue,
    tts_code: str,
    device: str,
    bytes_queue: asyncio.Queue,
    user: dict,
    personality_translation: dict,
):

    task_id = create_emotion_detection_task(
        f"{sentence}",
        user,
        personality_translation,
        "assistant",
        user["most_recent_chat_group_id"],
    )

    merged_audio = BytesIO()
    session = Session(settings.FISH_API_KEY)

    for chunk in session.tts(
        TTSRequest(
            reference_id=tts_code,
            text=sentence,
            format="pcm",
            latency="balanced",
        )
    ):
        merged_audio.write(chunk)

    sample_rate = 44100
    sample_width = 2  # bytes per sample for 16-bit audio
    channels = 1

    audio_segment = AudioSegment(
        data=merged_audio.getvalue(),
        sample_width=sample_width,
        frame_rate=sample_rate,
        channels=channels,
    )
    # decrease the volume by 10dB (-10-40)
    # audio_segment = audio_segment - 10
    resampled_segment = audio_segment.set_frame_rate(16000)
    audio_data = resampled_segment.raw_data

    if is_start:
        print("is_start++++++++", is_start)
        enqueue_bytes(bytes_queue, device, "info", None, "START", "START")

    if device == "web":
        base64_audio = base64.b64encode(audio_data).decode("utf-8")
        enqueue_bytes(
            bytes_queue, device, "response", base64_audio, sentence, None, task_id
        )
        enqueue_task(task_id_queue, task_id)
    else:
        chunk_size = 1024  # Adjust this value based on your needs
        # max_len = len(audio_data)
        # if max_len > 100:
        #     audio_data = audio_data[100:]
        # else:
        #     audio_data = audio_data
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            if i % 500 == 0:
                enqueue_bytes(bytes_queue, device, "gap", None, None, None, None)

            enqueue_bytes(
                bytes_queue, device, "response", chunk, sentence, None, task_id
            )


async def stream_audio(audio_stream, bytes_queue: asyncio.Queue, user, device):
    """
    Stream audio data
    Args:
        audio_stream: Async iterator yielding audio chunks
    """
    is_first_chunk = True
    async for chunk in audio_stream:
        if is_first_chunk:
            is_first_chunk = False
            enqueue_bytes(bytes_queue, device, "info", None, "START", "START")

        if chunk:
            audio = chunk["audio"]
            if device == "web":
                base64_audio = base64.b64encode(audio[50:]).decode("utf-8")
                enqueue_bytes(bytes_queue, device, "response", base64_audio, None)
            else:
                chunk_size = 1024
                audio = audio[50:]
                for i in range(0, len(audio), chunk_size):
                    if i % 500 == 0:
                        enqueue_bytes(bytes_queue, device, "gap", None, None, None)
                    chunk_data = audio[i : i + chunk_size]
                    enqueue_bytes(bytes_queue, device, "response", chunk_data, None)

    print("Streaming completed.")


async def text_to_speech_stream(
    text_iterator,
    bytes_queue,
    task_id_queue,
    user,
    device,
    voice_id,
    personality_translation,
    messages,
):
    """
    Stream text to speech using WebSocket API
    Args:
        text_iterator: Async iterator yielding text chunks
    """
    uri = "wss://api.fish.audio/v1/tts/live"  # Updated URI

    async with websockets.connect(
        uri, extra_headers={"Authorization": f"Bearer {settings.FISH_API_KEY}"}
    ) as websocket:
        # Send initial configuration
        await websocket.send(
            ormsgpack.packb(
                {
                    "event": "start",
                    "request": {
                        "text": "",
                        "latency": "normal",
                        "format": "wav",
                        "sample_rate": 16000,
                        "reference_id": voice_id,
                    },
                    "debug": True,  # Added debug flag
                }
            )
        )

        # Handle incoming audio data
        async def listen():
            while True:
                try:
                    message = await websocket.recv()
                    data = ormsgpack.unpackb(message)
                    # if  data.get("reason") exists, and data["reason"] == "stop" or data["reason"] == "error", send END to the client
                    if data.get("reason"):
                        if data["reason"] == "stop" or data["reason"] == "error":
                            enqueue_bytes(
                                bytes_queue, device, "info", None, "END", "END"
                            )
                    if data["event"] == "audio":
                        yield data
                except websockets.exceptions.ConnectionClosed:
                    break

        # Start audio streaming task
        listen_task = asyncio.create_task(
            stream_audio(listen(), bytes_queue, user, device)
        )

        # Stream text chunks
        response_text = ""
        accumulated_text = []
        async for text in text_iterator:
            # print("Text chunk:", text)
            if text:
                await websocket.send(ormsgpack.packb({"event": "text", "text": text}))
                response_text += text
                # await enqueue_response(response_queue, text)

                text = emoji.replace_emoji(text, replace="")
                accumulated_text.append(text)
                sentences = chunk_text_by_clause("".join(accumulated_text))

                sentences = [sentence for sentence in sentences if sentence]

                if len(sentences) > 1:
                    for sentence in sentences[:-1]:
                        print("Sentence:", sentence)

                        task_id = create_emotion_detection_task(
                            f"{sentence}",
                            user,
                            personality_translation,
                            "assistant",
                            user["most_recent_chat_group_id"],
                        )
                        if device == "web":
                            enqueue_bytes(
                                bytes_queue,
                                device,
                                "response",
                                None,
                                sentence,
                                None,
                                task_id,
                            )
                            enqueue_task(task_id_queue, task_id)

                    accumulated_text = [sentences[-1]]

        if accumulated_text:
            accumulated_text_ = "".join(accumulated_text)
            print("Sentence:", accumulated_text_)

            task_id = create_emotion_detection_task(
                f"{accumulated_text_}",
                user,
                personality_translation,
                "assistant",
                user["most_recent_chat_group_id"],
            )
            if device == "web":
                enqueue_bytes(
                    bytes_queue,
                    device,
                    "response",
                    None,
                    accumulated_text_,
                    None,
                    task_id,
                )
                enqueue_task(task_id_queue, task_id)

        print("Response text:", response_text)
        messages.append({"role": "assistant", "content": response_text})

        # Send stop signal
        await websocket.send(ormsgpack.packb({"event": "stop"}))
        await listen_task

    return response_text
