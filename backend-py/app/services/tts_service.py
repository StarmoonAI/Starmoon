import os

import azure.cognitiveservices.speech as speechsdk

# ! config
speech_config = speechsdk.SpeechConfig(
    subscription="d9e1868008cf477eb9cad5ddca6e4994", region="eastus"
)
audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)


speech_synthesizer = speechsdk.SpeechSynthesizer(
    speech_config=speech_config, audio_config=audio_config
)

# The language of the voice that speaks.
speech_synthesis_voice_name = "en-US-GuyNeural"
