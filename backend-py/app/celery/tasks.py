import os
from datetime import datetime

from app.celery.worker import celery_app
from deepgram import AnalyzeOptions, DeepgramClient, TextSource
from dotenv import load_dotenv

load_dotenv()

deepgram = DeepgramClient(os.getenv("DG_API_KEY"))


@celery_app.task(name="app.celery.tasks.analyze_text_task")
def analyze_text_task(utterance: str):
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
    return response_dict


# This is the celery periodic task
@celery_app.task
def print_current_time():
    print(f"Current time: {datetime.now()}")
