# import torch
# from TTS.api import TTS

# # Get device
# device = "cuda" if torch.cuda.is_available() else "cpu"
# device = "mps"

# # List available 🐸TTS models
# print(TTS().list_models())

# # Init TTS
# tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

# # Run TTS
# # ❗ Since this model is multi-lingual voice cloning model, we must set the target speaker_wav and language
# # Text to speech list of amplitude values as output
# wav = tts.tts(text="Hello world!", speaker_wav="audio.wav", language="en")
# # Text to speech to a file
# tts.tts_to_file(
#     text="Hello world!",
#     speaker_wav="audio.wav",
#     language="en",
#     file_path="output.wav",
# )

import os

from dotenv import load_dotenv

load_dotenv()

os.getenv("REPLICATE_API_TOKEN")
# input = {
#     "speaker": "source.ma4a",
#     "text": "Nailing those challenges feels amazing, right?",
#     "language": "en",
#     "cleanup_voice": True,
# }

# output = replicate.run(
#     ref="lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
#     input=input,
# )
# print("pintt", output)


# output = replicate.run(
#     "chenxwh/openvoice:d548923c9d7fc9330a3b7c7f9e2f91b2ee90c83311a351dfcd32af353799223d",
#     input={
#         "text": "Just know I'm here whenever you want to chat or need a sprinkle of fluffiness in your day.",
#         "audio": "https://example.com/voice.wav",
#         "speed": 1,
#         "language": "EN_NEWEST",
#     },
# )
# print(output)


import requests

url = "https://6aorzjhtqs31o9-8000.proxy.runpod.net/synthesize_speech/"
params = {
    "text": "Once uopn the time, there once was a guy who was super excited about his new voice-activated lamp. You know, one of those fancy ones that you just talk to, and it turns on or off.",
    "voice": "demo_speaker1",
    "accent": "en-newest",
    "language": "English",
    "speed": 1.0,
}

response = requests.get(url, params=params)
print(response.content)

with open("output1.wav", "wb") as f:
    f.write(response.content)
