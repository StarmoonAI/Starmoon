import os

import azure.cognitiveservices.speech as speechsdk
from app.core.config import settings

# ! config

SPEECH_KEY = settings.SPEECH_KEY
SPEECH_REGION = settings.SPEECH_REGION

speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)


speech_synthesizer = speechsdk.SpeechSynthesizer(
    speech_config=speech_config, audio_config=audio_config
)

# The language of the voice that speaks.
speech_synthesis_voice_name = "en-US-GuyNeural"
