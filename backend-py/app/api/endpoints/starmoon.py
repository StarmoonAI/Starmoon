import asyncio
import json
import os
import re
import uuid
from signal import SIGINT, SIGTERM

import azure.cognitiveservices.speech as speechsdk
import emoji
import openai
import requests
from app.celery.tasks import analyze_text_task
from app.core.auth import authenticate_user, validate_db
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
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)

emotion_mapping = {
    ("anger", "disgust"): "angry",
    ("anger", "fear"): "terrified",
    ("anger", "joy"): "shouting",
    ("anger", "neutral"): "terrified",
    ("anger", "sadness"): "terrified",
    ("anger", "surprise"): "shouting",
    ("disgust", "fear"): "terrified",
    ("disgust", "joy"): "default",
    ("disgust", "neutral"): "default",
    ("disgust", "sadness"): "terrified",
    ("disgust", "surprise"): "hopeful",
    ("fear", "joy"): "hopeful",
    ("fear", "neutral"): "whispering",
    ("fear", "sadness"): "terrified",
    ("fear", "surprise"): "terrified",
    ("joy", "neutral"): "friendly",
    ("joy", "sadness"): "default",
    ("joy", "surprise"): "cheerful",
    ("neutral", "sadness"): "hopeful",
    ("neutral", "surprise"): "friendly",
    ("sadness", "surprise"): "hopeful",
}


def voice_systhesizer(
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


async def speech_stream_response(ssml: str, websocket: WebSocket):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.speak_ssml_async(ssml).get()
    audio_data_stream = speechsdk.AudioDataStream(result)
    audio_buffer = bytes(32000)
    filled_size = audio_data_stream.read_data(audio_buffer)
    while filled_size > 0:
        await websocket.send_bytes(audio_buffer[:filled_size])
        filled_size = audio_data_stream.read_data(audio_buffer)
    speech_synthesizer.stop_speaking_async()


def get_emotion(text):

    API_URL = "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base"
    headers = {"Authorization": "Bearer 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"}

    def query(payload):
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()

    output = query(
        {
            "inputs": text,
        }
    )

    print(output)
    print("--------------------------------")
    res0 = output[0][0]
    res1 = output[0][1]
    score = res0["score"] + res1["score"]

    labels_tuple = (res0["label"], res1["label"])
    sorted_labels = tuple(sorted(labels_tuple))

    res = {"tone": emotion_mapping[sorted_labels], "score": score * 0.9}
    print(res)

    return res


async def send_response_and_speech(
    sentence: str, previous_sentence: str, websocket: WebSocket
):
    print("sentence+++", sentence)
    # combined_sentences = (
    #     f"{previous_sentence}\n\n{sentence}" if previous_sentence else sentence
    # )
    await websocket.send_json({"response": sentence.strip(), "is_running": True})
    # emotion = get_emotion(combined_sentences.strip())
    text_tone = voice_systhesizer(
        text=sentence.strip(),
        voice_name="en-US-AnaNeural",
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )
    await speech_stream_response(text_tone, websocket)
    await asyncio.sleep(0)


async def speech_stream_response_azure(
    transcription: dict, websocket: WebSocket, messages: list
):
    try:
        completion = client.client_azure_4o.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )

        accumulated_text = ""
        response_text = ""
        previous_sentence = transcription["transcription"]
        for chunk in completion:
            if len(chunk.choices) > 0:
                chunk_text = chunk.choices[0].delta.content
                if chunk_text:
                    chunk_text = emoji.replace_emoji(chunk_text, replace="")
                    accumulated_text += chunk_text
                    response_text += chunk_text
                    # TODO: store and update response_text in the database
                    sentences = re.split("(?<=[.。!?]) +", accumulated_text)
                    # If we have more than one sentence, send all but the last
                    if len(sentences) > 1:
                        for sentence in sentences[:-1]:
                            if sentence:
                                await send_response_and_speech(
                                    sentence, previous_sentence, websocket
                                )
                                # Update the previous sentence
                                previous_sentence = sentence
                        # Keep the last (possibly incomplete) sentence
                        accumulated_text = sentences[-1]
        # Send any remaining text
        if accumulated_text:
            await send_response_and_speech(
                accumulated_text, previous_sentence, websocket
            )
        await websocket.send_json({"response": "", "is_running": False})
        return response_text
    except Exception as e:
        msg = "Oops, it looks like we encountered some sensitive content, so we've terminate the conversation for now. Thanks for understanding!"
        await send_response_and_speech(msg, "", websocket)
        await websocket.send_json({"response": "", "is_running": False})
        return None


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
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
                "content": "You are an emotional care assistant, please respond to users in a chat-like manner.",
            },
        ]

        while True:
            # Receive message from the client
            transcription = await websocket.receive_json()
            # add to messages
            messages.append({"role": "user", "content": transcription["transcription"]})
            print(transcription)
            response_text = await speech_stream_response_azure(
                transcription, websocket, messages
            )
            # add to messages
            messages.append({"role": "assistant", "content": response_text})
            print("return response_text+++", response_text)

            print(messages)

    except WebSocketDisconnect:
        print("Client disconnected")
