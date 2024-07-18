import asyncio
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

load_dotenv()


CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000


class AudioClient:
    def __init__(self, uri):
        self.uri = uri
        self.p = pyaudio.PyAudio()
        self.audio_queue = asyncio.Queue(maxsize=50)  # Buffer for audio chunks
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
        self.playback_duration = 0  # Duration of the audio being played back

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
        print("Connected to server")

    async def send_audio(self):
        try:
            while True:
                data = await self.audio_queue.get()
                async with self.send_lock:
                    await self.websocket.send(data)
                print(f"Sent {len(data)} bytes")
        except Exception as e:
            print(f"Error in send_audio: {e}")

    async def receive_and_play_audio(self):
        try:
            while True:
                recv = await self.websocket.recv()
                if isinstance(recv, bytes):
                    # print(f"Received {len(recv)} bytes")
                    await self.loop.run_in_executor(
                        self.executor, self.stream_out.write, recv
                    )
                    chunk_duration = len(recv) / (RATE * CHANNELS * 2)
                    self.playback_duration = chunk_duration
                    print("chunk_duration", chunk_duration)
                else:
                    data = json.loads(recv)
                    print(f"Received: {data}")
                    if data.get("is_replying") is False:
                        await asyncio.sleep(self.playback_duration + 0.1)
                        await self.websocket.send(
                            json.dumps({"message": "", "is_replying": False})
                        )
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
    uri = "ws://localhost:8000/starmoon"
    client = AudioClient(uri)
    try:
        await client.run()
    except KeyboardInterrupt:
        print("Stopping...")
    finally:
        client.stop()


if __name__ == "__main__":
    asyncio.run(main())

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

    # import os

    # from groq import Groq

    # api_key = os.environ.get("GROQ_API_KEY")

    # client = Groq()
    # filename = "/Users/joeyxiong/Downloads/ted_60.wav"

    # with open(filename, "rb") as file:
    #     transcription = client.audio.transcriptions.create(
    #         file=(filename, file.read()),
    #         model="whisper-large-v3",
    #         prompt="Specify context or spelling",  # Optional
    #         response_format="json",  # Optional
    #         language="en",  # Optional
    #         temperature=0.0,  # Optional
    #     )
    #     print(transcription.text)
    #     print(transcription)
