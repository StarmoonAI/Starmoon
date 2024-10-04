import asyncio
import os
from datetime import datetime

import numpy as np
import requests
from app.celery.worker import celery_app
from app.core.config import settings
from app.db.conversations import add_msg
from deepgram import AnalyzeOptions, DeepgramClient, TextSource

# from dotenv import load_dotenv

# load_dotenv()

DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY
deepgram = DeepgramClient(DEEPGRAM_API_KEY)


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
def emotion_detection(
    text: str, user: dict, role: str, session_id: str, is_sensitive: bool = False
):
    HF_EMOTION_API_URL = settings.HF_EMOTION_API_URL
    token = settings.HF_ACCESS_TOKEN
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.post(
        HF_EMOTION_API_URL,
        headers=headers,
        json={"inputs": text, "parameters": {"top_k": 30}},
    )

    res = response.json()
    print("11111111", res)

    # Extract the raw scores
    raw_scores = np.array([item["score"] for item in res])
    print("22222222", raw_scores)

    # # Apply softmax to normalize the scores
    # exp_scores = np.exp(
    #     raw_scores - np.max(raw_scores)
    # )  # Subtract max for numerical stability
    # softmax_scores = exp_scores / exp_scores.sum()

    # Create the converted data dictionary with normalized scores
    # converted_data = {"scores": {res[i]["label"]: i for i in range(len(res))}}

    converted_data = {
        "scores": {res[i]["label"]: res[i]["score"] for i in range(len(res))}
    }

    print(converted_data)

    # ! update the supabase emotion scores
    add_msg(
        toy_id=user["toy_id"],
        personality_id=user["personality_id"],
        user_id=user["user_id"],
        role=role,
        content=text,
        metadata=converted_data,
        chat_group_id=session_id,
        is_sensitive=is_sensitive,
    )

    return converted_data
