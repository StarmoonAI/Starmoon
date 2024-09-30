import asyncio
import json
import re
import threading
import time

import emoji
from app.services.clients import Clients
from app.services.stt import get_deepgram_transcript
from app.services.tts import (
    azure_send_response_and_speech,
    azure_speech_response,
    azure_tts,
    azure_voice_systhesizer,
    check_task_result_hardware,
    create_emotion_detection_task,
)

# from app.services.tts import speech_stream_response
from app.utils.transcription_collector import TranscriptCollector
from fastapi import WebSocket, WebSocketDisconnect

import pyaudio

p = pyaudio.PyAudio()

transcript_collector = TranscriptCollector()
client = Clients()


CLAUSE_BOUNDARIES = r"\.|\?|!|。|;"


def chunk_text_by_clause(text):
    # Find clause boundaries using regular expression
    clause_boundaries = re.finditer(CLAUSE_BOUNDARIES, text)
    boundaries_indices = [boundary.end() for boundary in clause_boundaries]

    chunks = []
    start = 0
    for boundary_index in boundaries_indices:
        chunks.append(text[start:boundary_index].strip())
        start = boundary_index
    # Append the remaining part of the text
    if start < len(text):
        chunks.append(text[start:].strip())

    return chunks


class ConversationManagerHardware:
    def __init__(self):
        self.client_transcription = ""
        self.is_replying = False
        self.connection_open = True
        self.device = "web"
        self.is_interrupted = False
        self.check_task_result_tasks = []  # Store tasks for check_task_result

        self.speech_thread = None
        self.speech_thread_stop_event = None
        self.response_queue = asyncio.Queue()

    def set_device(self, device):
        self.device = device

    async def send_message(self, websocket: WebSocket, message):
        if self.connection_open:
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect as e:
                self.connection_open = False
                print(f"WebSocketDisconnect: Connection closed - {e}")
            except asyncio.TimeoutError as e:
                print(f"TimeoutError while sending message: {e}")
            except Exception as e:
                print(f"Error sending message: {e}")
                self.connection_open = False

    def speech_response(
        self,
        previous_sentence: str,
        utterance: str,
        messages: list,
        user: dict,
        session_id: str,
        device: str,
        stop_event: threading.Event,
    ):

        messages.append({"role": "user", "content": utterance})
        response = client.client_azure_4o.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )

        # send utterance to celery task
        task_id_input = create_emotion_detection_task(
            f"{previous_sentence}\n\n{utterance}", user, "user", session_id
        )

        if device == "web":
            self.response_queue.put_nowait(
                {
                    "type": "json",
                    "device": device,
                    "data": {
                        "type": "input",
                        "audio_data": None,
                        "text_data": utterance,
                        "boundary": None,
                        "task_id": task_id_input,
                    },
                }
            )
            task = asyncio.create_task(
                check_task_result_hardware(task_id_input, self.response_queue)
            )
            self.check_task_result_tasks.append(task)

        accumulated_text = []
        response_text = ""
        is_first_chunk = True
        previous_sentence = utterance

        for chunk in response:
            if self.is_interrupted or stop_event.is_set():
                self.is_interrupted = False
                # Cancel all check_task_result tasks
                for task in self.check_task_result_tasks:
                    task.cancel()
                    try:
                        asyncio.run(task)
                    except asyncio.CancelledError:
                        pass
                self.check_task_result_tasks.clear()
                break
            if not self.connection_open:
                break

            if chunk.choices and chunk.choices[0].delta.content:
                chunk_text = emoji.replace_emoji(
                    chunk.choices[0].delta.content, replace=""
                )
                # print("CONTENT:", chunk_text)
                accumulated_text.append(chunk_text)
                response_text += chunk_text
                sentences = chunk_text_by_clause("".join(accumulated_text))
                sentences = [sentence for sentence in sentences if sentence]

                if len(sentences) > 1:
                    for sentence in sentences[:-1]:
                        print("RESPONSE", sentence)
                        boundary = "start" if is_first_chunk else "mid"
                        task_id = create_emotion_detection_task(
                            f"{previous_sentence}\n\n{sentence}",
                            user,
                            "assistant",
                            session_id,
                        )
                        azure_tts(
                            sentence,
                            boundary,
                            task_id,
                            user["toy_id"],
                            device,
                            self.response_queue,
                        )
                        if device == "web":
                            task = asyncio.create_task(
                                check_task_result_hardware(task_id, self.response_queue)
                            )
                            self.check_task_result_tasks.append(task)
                        previous_sentence = sentence
                        is_first_chunk = False
                    accumulated_text = [sentences[-1]]

        if accumulated_text and (not self.is_interrupted or not stop_event.is_set()):
            accumulated_text_ = "".join(accumulated_text)
            print("RESPONSE+", accumulated_text_)
            task_id = create_emotion_detection_task(
                f"{previous_sentence}\n\n{accumulated_text_}",
                user,
                "assistant",
                session_id,
            )
            azure_tts(
                accumulated_text_,
                "end",
                task_id,
                user["toy_id"],
                device,
                self.response_queue,
            )
            if device == "web":
                task = asyncio.create_task(
                    check_task_result_hardware(task_id, self.response_queue)
                )
                self.check_task_result_tasks.append(task)
            previous_sentence = accumulated_text_

        return previous_sentence

    async def get_transcript(
        self,
        data_stream: asyncio.Queue,
        transcription_complete: asyncio.Event,
    ):
        def handle_utterance(utterance):
            self.client_transcription = utterance

        await get_deepgram_transcript(
            handle_utterance, data_stream, transcription_complete, transcript_collector
        )

    async def timeout_check(
        self,
        websocket: WebSocket,
        transcription_complete: asyncio.Event,
        is_replying: bool,
        timeout: int = 15,
    ):
        try:
            await asyncio.sleep(timeout - 10)
            if (
                not transcription_complete.is_set()
                and self.client_transcription == ""
                and is_replying == False
            ):
                print("This connection will be closed in 10 seconds...")
                json_data = json.dumps(
                    {
                        "type": "warning",  # Specify the type of message
                        "audio_data": None,
                        "text_data": "Reminder: No transcription detected, disconnecting in 10 seconds...",
                        "boundary": None,  # Use the boundary parameter instead of sentence
                        "task_id": None,
                    }
                )
            await self.send_message(websocket, json_data)
            await asyncio.sleep(10)
            if (
                not transcription_complete.is_set()
                and self.client_transcription == ""
                and not self.is_replying
            ):
                # Send OFF message and close connection
                await self.send_message(
                    websocket,
                    {
                        "type": "warning",
                        "audio_data": None,
                        "text_data": "OFF",
                        "boundary": None,
                        "task_id": None,
                    },
                )
                transcription_complete.set()
                # Explicitly close the WebSocket connection
                await websocket.close()
                self.connection_open = False
        except asyncio.CancelledError:
            return

    async def main(
        self,
        websocket: WebSocket,
        data_stream: asyncio.Queue,
        user: dict,
        messages: list,
    ):
        previous_sentence = None
        # Init thread-safe "a boolean flag" to indicate finished or not
        # processing_complete = threading.Event()

        stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, output=True)
        self.response_queue = asyncio.Queue()

        num = 0
        while self.connection_open:
            if not self.is_replying:
                transcription_complete = asyncio.Event()
                transcription_task = asyncio.create_task(
                    self.get_transcript(data_stream, transcription_complete)
                )
                timeout_task = asyncio.create_task(
                    self.timeout_check(
                        websocket,
                        transcription_complete,
                        self.is_replying,
                        timeout=30,
                    )
                )

                while not transcription_complete.is_set() and self.connection_open:
                    try:
                        message = await websocket.receive()
                        if message["type"] == "websocket.receive":
                            text_data = message.get("text")
                            bytes_data = message.get("bytes")
                            if text_data is not None:
                                try:
                                    data = json.loads(message["text"])
                                    print("message++++", data)
                                    if data.get("is_ending") == True:
                                        self.connection_open = False
                                        break
                                    if data.get("is_interrupted") == True:
                                        self.is_interrupted = True
                                        break
                                except json.JSONDecodeError:
                                    print("Received invalid JSON")
                            elif bytes_data is not None:
                                data = message["bytes"]
                                # stream.write(data)
                                await data_stream.put(data)

                    except WebSocketDisconnect:
                        self.connection_open = False
                        break

                if (
                    self.speech_thread
                    and self.speech_thread.is_alive()
                    and not self.speech_thread_stop_event.is_set()
                ):
                    # Signal the existing thread to stop
                    self.speech_thread_stop_event.set()
                    # Optionally wait for the thread to finish
                    self.speech_thread.join()
                # Create a new stop event for the new thread
                self.speech_thread_stop_event = threading.Event()

                speech_thread = threading.Thread(
                    target=self.speech_response,
                    args=(
                        previous_sentence,
                        self.client_transcription,
                        messages,
                        user,
                        user["most_recent_chat_group_id"],
                        self.device,
                        self.speech_thread_stop_event,
                    ),
                    daemon=True,
                )
                speech_thread.start()

                transcription_task.cancel()
                timeout_task.cancel()
                self.is_replying = True
                self.client_transcription = ""

            message = await websocket.receive()
            if message["type"] == "websocket.receive":
                if "bytes" in message:
                    data = message["bytes"]
                    # print(f"Received data length: {len(data)}", num)
                    if self.response_queue.qsize() > 0:
                        response_data = self.response_queue.get_nowait()
                        if response_data["type"] == "bytes":
                            await websocket.send_bytes(response_data["data"])
                            # if self.response_queue.qsize() is empty
                            if self.response_queue.qsize() == 0:
                                self.is_replying = False
                        else:
                            await websocket.send_text(json.dumps(response_data["data"]))
                    num += 1
