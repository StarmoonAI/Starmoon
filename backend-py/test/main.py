import asyncio
import base64
import json
import logging
import os
import threading
from concurrent.futures import ThreadPoolExecutor

import pyaudio
import sounddevice as sd
import websockets
from colorama import Fore, init
from dotenv import load_dotenv
from torch import device

load_dotenv()


CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000


class AudioClient:
    def __init__(self, token, uri):
        self.token = token
        self.uri = uri
        self.p = pyaudio.PyAudio()
        self.audio_queue = asyncio.Queue(maxsize=20)  # Buffer for audio chunks
        self.stream_in = self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK,
            stream_callback=self.audio_callback,
        )
        self.stream_out = self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            output=True,
            frames_per_buffer=CHUNK,
        )
        self.websocket = None
        self.send_lock = asyncio.Lock()
        self.loop = asyncio.get_event_loop()
        self.executor = ThreadPoolExecutor(max_workers=1)
        # self.playback_duration = 0  # Duration of the audio being played back

    def audio_callback(self, in_data, frame_count, time_info, status):
        self.loop.call_soon_threadsafe(self.loop.create_task, self.put_audio(in_data))
        return (None, pyaudio.paContinue)

    async def put_audio(self, in_data):
        try:
            await asyncio.wait_for(self.audio_queue.put(in_data), timeout=0.1)
        except asyncio.TimeoutError:
            print("Audio queue is full, dropping oldest chunk")
            try:
                self.audio_queue.get_nowait()
                await self.audio_queue.put(in_data)
            except asyncio.QueueEmpty:
                pass

    async def connect(self):
        self.websocket = await websockets.connect(
            self.uri, ping_interval=900, ping_timeout=900
        )
        try:
            await self.websocket.send(json.dumps({"token": self.token}))
            print("Connected to server")
        except Exception as e:
            print(f"Error in connect: {e}")

    async def send_audio(self):
        try:
            while True:
                data = await self.audio_queue.get()
                async with self.send_lock:
                    await self.websocket.send(data)
                # print(f"Sent {len(data)} bytes")
        except Exception as e:
            print(f"Error in send_audio: {e}")

    async def receive_and_play_audio(self):
        try:
            while True:
                recv = await self.websocket.recv()
                # print(recv)

                data = json.loads(recv)

                if data["type"] == "response":
                    # Decode the base64-encoded audio data
                    audio_data_base64 = data["audio_data"]
                    audio_data = base64.b64decode(audio_data_base64)

                    playback_duration = len(audio_data) / (RATE * CHANNELS * 2)
                    await self.loop.run_in_executor(
                        self.executor, self.stream_out.write, audio_data
                    )

                    if data["boundary"] == "end":
                        await asyncio.sleep(playback_duration + 0.1)
                        await self.websocket.send(
                            json.dumps({"speaker": "user", "is_replying": False})
                        )
                    elif data["boundary"] == "start":
                        await asyncio.sleep(playback_duration + 0.01)
                        await self.websocket.send(
                            json.dumps({"speaker": "user", "is_replying": True})
                        )

                elif data["type"] == "input":
                    print(Fore.GREEN + data["task_id"])

                elif data["type"] == "task":
                    print(Fore.BLUE + data["task_id"])

                elif data["type"] == "warning":
                    print(Fore.RED + data["text_data"])
                    # else:
                    #     pass
        except Exception as e:
            print(f"Error in receive_and_play_audio: {e}")

    async def run(self):
        await self.connect()
        self.stream_in.start_stream()
        send_task = asyncio.create_task(self.send_audio())
        receive_task = asyncio.create_task(self.receive_and_play_audio())
        await asyncio.gather(send_task, receive_task)

    def stop(self):
        self.stream_in.stop_stream()
        self.stream_in.close()
        self.stream_out.stop_stream()
        self.stream_out.close()
        self.p.terminate()
        self.executor.shutdown(wait=False)
        if self.websocket:
            asyncio.run(self.websocket.close())


async def main():
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bnJ1eGlvbmdAZ21haWwuY29tIiwidXNlcl9pZCI6IjAwNzljZWU5LTE4MjAtNDQ1Ni05MGE0LWU4YzI1MzcyZmUyOSIsImNyZWF0ZWRfdGltZSI6IjIwMjQtMDctMDhUMDA6MDA6MDAuMDAwWiJ9.tN8PhmPuiXAUKOagOlcfNtVzdZ1z--8H2HGd-zk6BGE"
    uri = "ws://localhost:8000/starmoon"
    # uri = "wss://api.starmoon.app/starmoon"
    client = AudioClient(token, uri)
    try:
        await client.run()
    except KeyboardInterrupt:
        print("Stopping...")
    finally:
        client.stop()


if __name__ == "__main__":
    asyncio.run(main())
    # from funasr import AutoModel

    # model = AutoModel(model="iic/emotion2vec_plus_large", device="mps")
    # wav_file = f"/Users/joeyxiong/Downloads/voice.wav"
    # res = model.generate(
    #     wav_file,
    #     output_dir="./outputs",
    #     granularity="utterance",
    #     extract_embedding=False,
    # )
    # print(res)
    # # ! for text: michellejieli/emotion_text_classifier / j-hartmann/emotion-english-distilroberta-base

    # When the client is play audio response, the server don't send the mic audio back unless user interrupt it
    # import whisperx

    # model = whisperx.load_model
    # tokenizer = whisperx.load_token

    # from whisper_online import *

    # src_lan = "en"  # source language
    # tgt_lan = "en"  # target language  -- same as source for ASR, "en" if translate task is used

    # asr = OpenaiApiASR()

    # from diart import SpeakerDiarization
    # from diart.inference import StreamingInference
    # from diart.sinks import RTTMWriter
    # from diart.sources import MicrophoneAudioSource

    # pipeline = SpeakerDiarization()
    # mic = MicrophoneAudioSource()
    # inference = StreamingInference(pipeline, mic)

    # # print the realt time data callback to attach_hooks
    # def attach_hooks(prediction):
    #     print(prediction)

    # inference.attach_hooks(attach_hooks)
    # prediction = inference()

    # print(prediction)

    # import torch
    # from transformers import pipeline
    # from transformers.utils import is_flash_attn_2_available

    # pipe = pipeline(
    #     "automatic-speech-recognition",
    #     model="openai/whisper-large-v3",  # select checkpoint from https://huggingface.co/openai/whisper-large-v3#model-details
    #     torch_dtype=torch.float16,
    #     device="mps",  # or mps for Mac devices
    #     model_kwargs=(
    #         {"attn_implementation": "flash_attention_2"}
    #         if is_flash_attn_2_available()
    #         else {"attn_implementation": "sdpa"}
    #     ),
    # )

    # outputs = pipe(
    #     "/Users/joeyxiong/Downloads/ted_60.wav",
    #     chunk_length_s=30,
    #     batch_size=24,
    #     return_timestamps=True,
    # )

    # print(outputs)
