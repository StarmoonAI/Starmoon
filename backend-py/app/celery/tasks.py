import asyncio
import os
from datetime import datetime

import requests
from app.celery.worker import celery_app
from app.core.config import settings
from app.services.clients import Clients
from deepgram import AnalyzeOptions, DeepgramClient, TextSource

# from dotenv import load_dotenv

# load_dotenv()

DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY
deepgram = DeepgramClient(DEEPGRAM_API_KEY)
client = Clients()


@celery_app.task(name="app.celery.tasks.analyze_text_task")
def analyze_text_task(utterance: str, transcription_id: str):
    options_analyzer = AnalyzeOptions(
        language="en",
        sentiment=True,
        intents=True,
        topics=True,
    )
    payload: TextSource = {"buffer": utterance}
    response = deepgram.read.analyze.v("1").analyze_text(payload, options_analyzer)

    # Convert the AnalyzeResponse object to a dictionary
    response_dict = response.to_dict() if hasattr(response, "to_dict") else response
    return {"transcription_id": transcription_id, "analysis": response_dict}


# This is the celery periodic task
@celery_app.task
def print_current_time(utterance: str, messages: list):
    print(f"Current time: {datetime.now()}")


@celery_app.task(name="app.celery.tasks.emotion_detection")
def emotion_detection(text: str):
    API_URL = "https://api-inference.huggingface.co/models/michellejieli/emotion_text_classifier"
    token = settings.HF_ACCESS_TOKEN
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.post(API_URL, headers=headers, json={"inputs": text})

    return response.json()


# @celery_app.task(name="app.celery.tasks.speech_stream_response_task")
# def speech_stream_response_task(utterance: str, websocket: WebSocket, messages: list):
#     print("speech_stream_response_task")


# @celery_app.task(name="app.celery.tasks.voice_response")
# async def speech_stream_response_task(utterance: str, messages: list):
#     messages.append({"role": "user", "content": utterance})

#     completion = client.client_azure_4o.chat.completions.create(
#         model="gpt-4o",
#         messages=messages,
#         stream=True,
#     )
#     accumulated_text = []
#     response_text = ""
#     previous_sentence = utterance
#     is_first_chunk = True

#     for chunk in completion:
#         if chunk.choices and chunk.choices[0].delta.content:
#             chunk_text = emoji.replace_emoji(chunk.choices[0].delta.content, replace="")
#             asyncio.sleep(3)
#             print("hahah")
