import asyncio
import base64
import json
import os
import re
import time
import uuid
from signal import SIGINT, SIGTERM

import azure.cognitiveservices.speech as speechsdk
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
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from networkx import boundary_expansion

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
        print("==========", part)
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        return " ".join(self.transcript_parts)

    def get_length(self):
        return len(self.transcript_parts)


transcript_collector = TranscriptCollector()
manager = ConnectionManager()
is_finals = []


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
    sentence: str, previous_sentence: str, boundary: str, websocket: WebSocket
):
    print("sentence+++", sentence)
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
            "task_id": "123",
        }
    )

    # Send the JSON object over the WebSocket connection
    await websocket.send_text(json_data)


async def speech_stream_response(utterance: str, websocket: WebSocket, messages: list):
    messages.append({"role": "user", "content": utterance})

    completion = client.client_azure_4o.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
    )
    accumulated_text = []
    response_text = ""
    previous_sentence = utterance
    is_first_chunk = True

    for chunk in completion:
        if chunk.choices and chunk.choices[0].delta.content:
            chunk_text = emoji.replace_emoji(chunk.choices[0].delta.content, replace="")

            accumulated_text.append(chunk_text)
            response_text += chunk_text
            # TODO: store and update response_text in the database
            sentences = re.split(r"(?<=[.。!?])\s+", "".join(accumulated_text))

            # send the first sentence to the client
            if len(sentences) > 1:
                for sentence in sentences[:-1]:
                    # await get_synthetic_voice(
                    #     websocket,
                    #     sentence,
                    # )
                    boundary = "start" if is_first_chunk else "mid"
                    await azure_send_response_and_speech(
                        sentence, previous_sentence, boundary, websocket
                    )
                    await asyncio.sleep(0)
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
                await azure_send_response_and_speech(
                    accumulated_text_, previous_sentence, "end", websocket
                )
                await asyncio.sleep(0.01)
            break

    # if accumulated_text:
    #     accumulated_text_ = "".join(accumulated_text)
    #     # await get_synthetic_voice(websocket,accumulated_text_)
    #     await azure_send_response_and_speech(
    #         accumulated_text_, previous_sentence, websocket
    #     )
    #     await asyncio.sleep(0.1)

    # await websocket.send_json({"message": "", "is_replying": False})

    messages.append({"role": "system", "content": response_text})
    return response_text


class ConversationManager:
    def __init__(instance):
        instance.client_transcription = ""
        instance.is_replying = False

    async def main(
        instance, websocket: WebSocket, user_id: str, session_id: str, messages: list
    ):
        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram = DeepgramClient(os.getenv("DG_API_KEY"), config)
        dg_connection = deepgram.listen.asynclive.v("1")

        def handle_utterance(utterance):
            instance.client_transcription = utterance

        async def on_open(self, open, **kwargs):
            print(f"Connection Open")

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript

            if len(sentence.strip()) == 0:
                return

            print(f"Sentence: %s" % sentence, result.is_final, result.speech_final)

            if instance.is_replying:
                return

            # ! reset result.channel.alternatives[0].transcript
            if result.is_final and not instance.is_replying:
                transcript_collector.add_part(sentence)
                if result.speech_final:
                    utterance = transcript_collector.get_full_transcript()
                    utterance = utterance.strip()
                    print("utterance---", utterance)
                    handle_utterance(utterance)

                    instance.is_replying = True
                    asyncio.create_task(
                        speech_stream_response(utterance, websocket, messages)
                    )
                    transcript_collector.reset()
                    # await save_transcription_to_supabase(utterance)
            #     else:
            #         await websocket.send_text(f"Is Final: {sentence}")
            # else:
            #     await websocket.send_text(f"Interim Results: {sentence}")

        async def on_metadata(self, metadata, **kwargs):
            print(f"Metadata: {metadata}")

        async def on_utterance_end(self, utterance_end, **kwargs):
            if transcript_collector.get_length() > 0 and not instance.is_replying:
                # transcription_id = str(uuid.uuid4())
                utterance = transcript_collector.get_full_transcript()
                utterance = utterance.strip()
                print("utterance+++", utterance)
                handle_utterance(utterance)

                instance.is_replying = True
                asyncio.create_task(
                    speech_stream_response(utterance, websocket, messages)
                )

                transcript_collector.reset()
                # await save_transcription_to_supabase(utterance)

        dg_connection.on(LiveTranscriptionEvents.Open, on_open)
        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Metadata, on_metadata)
        dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

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
        )

        addons = {"no_delay": "true"}

        if await dg_connection.start(options, addons=addons) is False:
            return

        try:
            while True:
                message = await websocket.receive()
                await asyncio.sleep(0)
                if message["type"] == "websocket.receive":
                    if "bytes" in message:
                        data = message["bytes"]
                        # if not instance.is_replying:
                        await dg_connection.send(data)
                    elif "text" in message:
                        print("message++++", message)
                        try:
                            data = json.loads(message["text"])
                            if data.get("is_replying") == False:
                                instance.is_replying = False
                                transcript_collector.reset()
                        except json.JSONDecodeError:
                            print("Received invalid JSON")
        except WebSocketDisconnect:
            await dg_connection.finish()


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_manager = ConversationManager()
    try:
        # authenticate
        token = await websocket.receive_json()
        print(token)
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

        await conversation_manager.main(websocket, "123", "123", messages)

        # await handle_transcription(websocket, "123", "123", messages)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in websocket_endpoint: {e}")
        manager.disconnect(websocket)
