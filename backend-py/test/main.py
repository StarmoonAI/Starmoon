import asyncio
import json
import logging
import os
import time
from signal import SIGINT, SIGTERM

import pyaudio
import pygame
import sounddevice as sd
import websockets
from colorama import Fore, init
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveOptions,
    LiveTranscriptionEvents,
    Microphone,
)
from dotenv import load_dotenv
from pygame import mixer

load_dotenv()


# from record import play_audio, record_audio

URI = "wss://api.starmoon.app"
# URI = "ws://localhost:8000"
# wss://api.starmoon.app for https
# "ws://localhost:8000" for http


audio_player = pyaudio.PyAudio()
mixer.init()


class TranscriptCollector:
    def __init__(self):
        self.reset()

    def reset(self):
        self.transcript_parts = []

    def add_part(self, part):
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        return " ".join(self.transcript_parts)


transcript_collector = TranscriptCollector()


def play_audio(data):
    sd.play(data, samplerate=16000, blocking=True)


async def get_transcript(callback):
    transcription_complete = asyncio.Event()  # Event to signal transcription completion

    try:
        # example of setting up a client config. logging values: WARNING, VERBOSE, DEBUG, SPAM
        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram: DeepgramClient = DeepgramClient(os.getenv("DG_API_KEY"), config)

        dg_connection = deepgram.listen.asynclive.v("1")
        print("Listening...")

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript

            if not result.speech_final:
                transcript_collector.add_part(sentence)
            else:
                # This is the final part of the current sentence
                transcript_collector.add_part(sentence)
                full_sentence = transcript_collector.get_full_transcript()
                # Check if the full_sentence is not empty before printing
                if len(full_sentence.strip()) > 0:
                    full_sentence = full_sentence.strip()
                    print(f"Human: {full_sentence}")
                    callback(full_sentence)  # Call the callback with the full_sentence
                    transcript_collector.reset()
                    transcription_complete.set()  # Signal to stop transcription and exit

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)

        options = LiveOptions(
            model="nova-2",
            punctuate=True,
            language="en-US",
            smart_format=True,
            encoding="linear16",
            # channels=1,
            multichannel=True,
            sample_rate=16000,
            # interim_results=True,
            # utterance_end_ms="1500",
            vad_events=True,
            endpointing=300,
            filler_words=True,
            numerals=True,
            diarize=True,
        )

        addons = {"no_delay": "true"}
        await dg_connection.start(options, addons)

        # Open a microphone stream on the default input device
        microphone = Microphone(dg_connection.send)
        microphone.start()

        await transcription_complete.wait()  # Wait for the transcription to complete instead of looping indefinitely

        # Wait for the microphone to close
        microphone.finish()

        # Indicate that we've finished
        await dg_connection.finish()

    except Exception as e:
        print(f"Could not open socket: {e}")
        return


class ConversationManager:
    def __init__(self, token):
        self.transcription_response = ""
        self.token = token
        self.is_running = True

    async def main(self):
        def handle_full_sentence(full_sentence):
            self.transcription_response = full_sentence

        async with websockets.connect(
            f"{URI}/starmoon", ping_interval=2100, ping_timeout=2100
        ) as websocket:
            try:
                # authenticate with the server
                await websocket.send(json.dumps({"token": self.token}))
                while True:
                    # 🟢 step 1: get transcript
                    await get_transcript(handle_full_sentence)

                    # 🟢 Check for "goodbye" to exit the loop
                    if "goodbye" in self.transcription_response.lower():
                        break

                    # 🟢 Step 2: Send text + token to server
                    print(self.transcription_response)
                    await websocket.send(
                        json.dumps(
                            {
                                "transcription": self.transcription_response,
                            }
                        ),
                    )

                    # 🟢 Step 3: Receive audio response from server
                    # p = pyaudio.PyAudio()
                    # stream = p.open(
                    #     format=pyaudio.paInt16, channels=1, rate=16000, output=True
                    # )
                    while self.is_running:
                        start_time = time.time()
                        response = await websocket.recv()
                        print("recived time-----:", time.time())
                        if isinstance(response, bytes):
                            print("Received audio response from server")
                            # stream.write(response)
                            # save the audio response to a wav file
                            with open("output.wav", "wb") as f:
                                f.write(response)
                            print("time++", time.time() - start_time)
                            sound = mixer.Sound("output.wav")
                            sound.play()
                            pygame.time.wait(int(sound.get_length() * 1000))
                        else:
                            print(Fore.GREEN + response)
                            response = json.loads(response)
                            # hold for 5 seconds
                            # if response["is_running"] is True:
                            #     time.sleep(5)
                            if response["is_running"] is False:
                                break

                    # Wait until all audio chunks are played
                    # stream.stop_stream()
                    # stream.close()
                    # p.terminate()

                    # 🟢 Reset transcription_response for the next loop iteration
                    self.transcription_response = ""
            except websockets.exceptions.ConnectionClosed as e:
                print(f"Connection closed with code: {e.code}, reason: {e.reason}")
                if e.code == 4001:
                    print("Authentication failed. Please check your token.")


if __name__ == "__main__":
    manager = ConversationManager(
        token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bnJ1eGlvbmdAZ21haWwuY29tIiwidXNlcl9pZCI6IjAwNzljZWU5LTE4MjAtNDQ1Ni05MGE0LWU4YzI1MzcyZmUyOSIsImNyZWF0ZWRfdGltZSI6IjIwMjQtMDctMDhUMDA6MDA6MDAuMDAwWiJ9.tN8PhmPuiXAUKOagOlcfNtVzdZ1z--8H2HGd-zk6BGE"
    )
    loop = asyncio.get_event_loop()
    loop.run_until_complete(manager.main())
    # asyncio.run(manager.main())
