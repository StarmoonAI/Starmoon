import asyncio
import base64
import json
import os
import re
import time
import uuid

import azure.cognitiveservices.speech as speechsdk
import emoji
import numpy as np
import openai
import requests
import torch
from app.celery.tasks import emotion_detection

# from app.celery.tasks import speech_stream_response_task
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
        # print("==========", part)
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        return " ".join(self.transcript_parts)

    def get_length(self):
        return len(self.transcript_parts)


transcript_collector = TranscriptCollector()
manager = ConnectionManager()


def azure_voice_systhesizer(
    text: str,
    language: str = "en-US",
    voice_name: str = "en-US-AvaMultilingualNeural",
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


def azure_speech_response(ssml: str, websocket: WebSocket):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.speak_ssml_async(ssml).get()
    # send response back to the client
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # await websocket.send_bytes(result.audio_data)
        return result

    return None


async def azure_send_response_and_speech(
    sentence: str, boundary: str, websocket: WebSocket, task_id: str
):
    # print("sentence+++", sentence)
    # combined_sentences = (
    #     f"{previous_sentence}\n\n{sentence}" if previous_sentence else sentence
    # )
    # emotion = get_emotion(combined_sentences.strip())
    text_tone = azure_voice_systhesizer(
        text=sentence.strip(),
        voice_name="en-US-AvaMultilingualNeural",
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )
    # print finished time

    result = azure_speech_response(text_tone, websocket)

    # Encode the audio data to base64
    audio_data_base64 = base64.b64encode(result.audio_data).decode("utf-8")

    # Create a JSON object with the encoded data
    json_data = json.dumps(
        {
            "type": "response",  # Specify the type of message
            "audio_data": audio_data_base64,
            "text_data": sentence,
            "boundary": boundary,  # Use the boundary parameter instead of sentence
            "task_id": task_id,
        }
    )

    # Send the JSON object over the WebSocket connection
    await websocket.send_text(json_data)


def create_emotion_detection_task(utterance: str):
    # send utterance to celery task
    celery_task = emotion_detection.delay(utterance)
    task_id = celery_task.id

    return task_id


async def check_task_result(task_id, websocket):
    celery_task = AsyncResult(task_id)

    while not celery_task.ready():
        await asyncio.sleep(0.5)  # Wait for 0.5 second before checking again
    result = celery_task.result

    await websocket.send_text(
        json.dumps(
            {
                "type": "task",
                "audio_data": None,
                "text_data": result,
                "boundary": None,
                "task_id": task_id,
            }
        )
    )


def split_sentences(text, min_length=30):
    sentences = re.split(r"(?<=[.。!?])\s+", text)
    result = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) < min_length:
            current += " " + sentence if current else sentence
        else:
            if current:
                result.append(current)
            current = sentence
    if current:
        result.append(current)
    return result


async def speech_stream_response(utterance: str, websocket: WebSocket, messages: list):
    try:
        # send utterance to celery task
        task_id_input = create_emotion_detection_task(utterance)
        # Send the utterance to client
        await websocket.send_text(
            json.dumps(
                {
                    "type": "input",
                    "audio_data": None,
                    "text_data": utterance,
                    "boundary": None,
                    "task_id": task_id_input,
                }
            )
        )
        asyncio.create_task(check_task_result(task_id_input, websocket))

        messages.append({"role": "user", "content": utterance})
        completion = client.client_azure_4o.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )
        accumulated_text = []
        response_text = ""
        is_first_chunk = True

        for chunk in completion:
            if chunk.choices and chunk.choices[0].delta.content:
                chunk_text = emoji.replace_emoji(
                    chunk.choices[0].delta.content, replace=""
                )

                accumulated_text.append(chunk_text)
                response_text += chunk_text
                # TODO: store and update response_text in the database
                # sentences = split_sentences("".join(accumulated_text))
                sentences = re.split(r"(?<=[.。!?])\s+", "".join(accumulated_text))

                # send the first sentence to the client
                if len(sentences) > 1:
                    for sentence in sentences[:-1]:
                        boundary = "start" if is_first_chunk else "mid"
                        task_id = create_emotion_detection_task(sentence)
                        await azure_send_response_and_speech(
                            sentence, boundary, websocket, task_id
                        )
                        await asyncio.sleep(0)
                        asyncio.create_task(check_task_result(task_id, websocket))

                    accumulated_text = [sentences[-1]]

            if is_first_chunk:
                print("This is the first chunk")
                is_first_chunk = False

            # Check if this is the last chunk
            if chunk.choices and chunk.choices[0].finish_reason is not None:
                print("This is the last chunk")
                # Process any remaining text
                if accumulated_text:
                    accumulated_text_ = "".join(accumulated_text)
                    task_id = create_emotion_detection_task(accumulated_text_)
                    await azure_send_response_and_speech(
                        accumulated_text_, "end", websocket, task_id
                    )
                    await asyncio.sleep(0)
                    asyncio.create_task(check_task_result(task_id, websocket))
                break

        messages.append({"role": "system", "content": response_text})

        return response_text

    except Exception as e:
        print(f"Error in speech_stream_response: {e}")

        error_message = "Oops, it looks like we encountered some sensitive content, so we've removed this message. I'm sorry for that!"
        task_id = create_emotion_detection_task(error_message)
        await azure_send_response_and_speech(error_message, "end", websocket, task_id)
        await asyncio.sleep(0)
        asyncio.create_task(check_task_result(task_id, websocket))
        messages.pop()

        return None


async def get_deepgram_transcript(
    callback, data_stream: asyncio.Queue, transcription_complete: asyncio.Event
):
    try:
        # example of setting up a client config. logging values: WARNING, VERBOSE, DEBUG, SPAM
        # config = DeepgramClientOptions(options={"keepalive": "false"})
        # deepgram = DeepgramClient(os.getenv("DG_API_KEY"), config)
        deepgram = DeepgramClient(os.getenv("DG_API_KEY"))
        dg_connection = deepgram.listen.asynclive.v("1")
        # print("Listening...")

        async def on_open(self, open, **kwargs):
            print(f"Connection Open...")

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript

            if len(sentence.strip()) == 0:
                return

            if result.is_final:
                transcript_collector.add_part(sentence)
                if result.speech_final:
                    utterance = transcript_collector.get_full_transcript()
                    utterance = utterance.strip()
                    print("utterance---", utterance)
                    callback(utterance)
                    transcript_collector.reset()
                    transcription_complete.set()
                    # await save_transcription_to_supabase(utterance)
            #     else:
            #         await websocket.send_text(f"Is Final: {sentence}")
            # else:
            #     await websocket.send_text(f"Interim Results: {sentence}")

        async def on_utterance_end(self, utterance_end, **kwargs):
            if transcript_collector.get_length() > 0:
                # transcription_id = str(uuid.uuid4())
                utterance = transcript_collector.get_full_transcript()
                utterance = utterance.strip()
                # print("utterance+++", utterance)
                callback(utterance)

                transcript_collector.reset()
                transcription_complete.set()
                # await save_transcription_to_supabase(utterance)

        dg_connection.on(LiveTranscriptionEvents.Open, on_open)
        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

        options = LiveOptions(
            model="nova-2",
            punctuate=True,
            language="en-US",
            smart_format=True,
            encoding="linear16",
            # channels=1,
            multichannel=True,
            sample_rate=16000,
            interim_results=True,
            utterance_end_ms="1000",
            vad_events=True,
            endpointing=300,
            filler_words=True,
            numerals=True,
            diarize=True,
        )

        addons = {"no_delay": "true"}

        if await dg_connection.start(options, addons=addons) is False:
            return

        try:
            while not transcription_complete.is_set():
                data = await data_stream.get()
                await dg_connection.send(data)
        except WebSocketDisconnect:
            await dg_connection.finish()

        await transcription_complete.wait()  # Wait for the transcription to complete instead of looping indefinitely

        # Indicate that we've finished
        await dg_connection.finish()

    except Exception as e:
        print(f"Could not open socket: {e}")
        return


class ConversationManager:
    def __init__(self):
        self.client_transcription = ""
        self.is_replying = False

    async def get_transcript(
        self,
        data_stream: asyncio.Queue,
        transcription_complete: asyncio.Event,
    ):
        def handle_utterance(utterance):
            self.client_transcription = utterance

        await get_deepgram_transcript(
            handle_utterance, data_stream, transcription_complete
        )

    async def timeout_check(
        self,
        websocket: WebSocket,
        transcription_complete: asyncio.Event,
        timeout: int = 15,
    ):
        try:
            await asyncio.sleep(timeout - 10)
            if not transcription_complete.is_set() and self.client_transcription == "":
                print("This connection will be closed in 10 seconds...")
                json_data = json.dumps(
                    {
                        "type": "warning",  # Specify the type of message
                        "audio_data": None,
                        "text_data": "Reminder: No transcription detected, disconnecting in 10 seconds...",
                        "boundary": None,  # Use the boundary parameter instead of sentence
                        "task_id": None,
                    }
                )
            await websocket.send_text(json_data)
            await asyncio.sleep(10)
            if not transcription_complete.is_set() and self.client_transcription == "":
                transcription_complete.set()
        except asyncio.CancelledError:
            return

    async def main(
        self,
        websocket: WebSocket,
        data_stream: asyncio.Queue,
        user_id: str,
        session_id: str,
        messages: list,
    ):
        while True:
            if not self.is_replying:
                transcription_complete = asyncio.Event()
                transcription_task = asyncio.create_task(
                    self.get_transcript(data_stream, transcription_complete)
                )

                timeout_task = asyncio.create_task(
                    self.timeout_check(websocket, transcription_complete, timeout=20)
                )

                while not transcription_complete.is_set():
                    message = await websocket.receive()
                    if message["type"] == "websocket.receive":
                        if "text" in message:
                            print("message++++", message)
                            try:
                                data = json.loads(message["text"])
                            except json.JSONDecodeError:
                                print("Received invalid JSON")
                        elif "bytes" in message:
                            data = message["bytes"]
                            await data_stream.put(data)

                transcription_task.cancel()
                timeout_task.cancel()

                if not self.client_transcription:
                    # await websocket.send_text(
                    #     "No transcription detected, disconnecting..."
                    # )
                    await websocket.close()
                    break

                self.is_replying = True

                # get the return of create_task and send celery task
                asyncio.create_task(
                    speech_stream_response(
                        self.client_transcription, websocket, messages
                    )
                )

                self.client_transcription = ""

            else:
                print("is replying")
                transcription_complete.set()
                transcription_task.cancel()
                # do other process + interrupt detection (no deepgram)
                message = await websocket.receive()
                if message["type"] == "websocket.receive":
                    if "bytes" in message:
                        data = message["bytes"]
                    elif "text" in message:
                        print("message++++", message)
                        try:
                            data = json.loads(message["text"])
                            if data.get("is_replying") == False:
                                self.is_replying = False
                                transcript_collector.reset()
                        except json.JSONDecodeError:
                            print("Received invalid JSON")


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_manager = ConversationManager()
    data_stream = asyncio.Queue()
    try:
        # ! 0 authenticate
        token = await websocket.receive_json()
        # print(token)
        user = await authenticate_user(token["token"])
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        messages = [
            {
                "role": "system",
                "content": f" {SYS_PROMPT_PREFIX}\n\nYou are a plushie connoisseur of comfort named Coco, radiating warmth and coziness. Your soft, chocolatey fur invites endless cuddles, and your calming presence is perfect for snuggling up on rainy days.",
            },
        ]

        await conversation_manager.main(
            websocket,
            data_stream,
            "123",
            "123",
            messages,
        )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in websocket_endpoint: {e}")
        manager.disconnect(websocket)
