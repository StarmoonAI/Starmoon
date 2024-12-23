import asyncio
import json
import re
import threading
import time

import emoji
import nltk
from app.core.config import settings
from app.prompt.conversation_prompt import (
    get_error_prompt_prefix,
    get_greeting_prompt_prefix,
)

# import pyaudio
from app.services.clients import Clients
from app.services.stt import get_deepgram_transcript
from app.services.tts import (
    azure_tts,
    check_task_result,
    create_emotion_detection_task,
    fish_tts,
    text_to_speech_stream,
)
from app.utils.enqueue import enqueue_bytes, enqueue_task
from app.utils.transcription_collector import TranscriptCollector
from app.utils.utils import append_response_text
from fastapi import WebSocket, WebSocketDisconnect

# from app.models.user import User
transcript_collector = TranscriptCollector()
client = Clients()
# p = pyaudio.PyAudio()


CLAUSE_BOUNDARIES = r"\.|\?|？|!|！|。|;|；|\n"
GREETING_PROMPT = "Given the above chat history, user information and your responsibilities and character persona, generate ONLY ONE short greeting sentence that conatain some basic user information, interests or open questions to user:"


def get_buffer_from_rssi(rssi: int) -> int:
    if rssi >= -39:
        # -30 dBm to -50 dBm: Excellent signal
        buffer = 5
    elif rssi >= -55:
        # -50 dBm to -67 dBm: Very good signal
        buffer = 8
    elif rssi >= -67:
        # -50 dBm to -67 dBm: Very good signal
        buffer = 10
    elif rssi >= -70:
        # -67 dBm to -70 dBm: Good signal
        buffer = 20
    elif rssi >= -80:
        # -70 dBm to -80 dBm: Fair signal
        buffer = 40
    else:
        # -80 dBm or lower: Poor signal
        buffer = 70

    return buffer


def chunk_text_by_clause(text, lang_code):
    sentences = []
    if lang_code == "zh-CN":
        # Only split if text length is longer than 12
        if len(text) > 12:
            # Find clause boundaries using regular expression
            clause_boundaries = re.finditer(CLAUSE_BOUNDARIES, text)
            boundaries_indices = [boundary.end() for boundary in clause_boundaries]

            start = 0
            for boundary_index in boundaries_indices:
                chunk = text[start:boundary_index].strip()
                if len(chunk) > 12:
                    sentences.append(chunk)
                start = boundary_index

            # Append the remaining part of the text
            if start < len(text):
                chunk = text[start:].strip()
                if len(chunk) > 12:
                    sentences.append(chunk)
    else:
        if len(text) > 30:
            # Find clause boundaries using regular expression
            clause_boundaries = re.finditer(CLAUSE_BOUNDARIES, text)
            boundaries_indices = [boundary.end() for boundary in clause_boundaries]

            start = 0
            for boundary_index in boundaries_indices:
                chunk = text[start:boundary_index].strip()
                if len(chunk) > 30:
                    sentences.append(chunk)
                start = boundary_index

            # Append the remaining part of the text
            if start < len(text):
                chunk = text[start:].strip()
                if len(chunk) > 30:
                    sentences.append(chunk)

    #     # First, split into sentences using NLTK
    #     initial_sentences = nltk.sent_tokenize(text)

    #     for s in initial_sentences:
    #         parts = s.split("。")
    #         for part in parts:
    #             part = part.strip()
    #             # Check the length of the resulting part
    #             if len(part) > 20:
    #                 sentences.append(part)

    return sentences


async def bytes2client(websocket: WebSocket, bytes_queue: asyncio.Queue, device: str):
    # try:
    if bytes_queue.qsize() > 0:
        if device == "web":
            response_data = bytes_queue.get_nowait()
            await websocket.send_json((response_data["data"]))
        else:
            response_data = bytes_queue.get_nowait()
            if response_data["data"]["type"] == "response":
                await websocket.send_bytes(response_data["data"]["audio_data"])
            else:
                await websocket.send_json(response_data["data"])


# except Exception as e:
#     print(f"Error in send2client: {e}")
#     return


async def json2client(websocket: WebSocket, type: str, device: str, data):
    try:
        await websocket.send_json(
            {
                "type": type,
                "device": device,
                "audio_data": None,
                "text_data": data,
                "task_id": None,
            }
        )
    except Exception as e:
        print(f"Error in send2client: {e}")
        return


def azure_handle_sentence(sentence):
    print("Synthesized Sentence:", sentence)


class ConvManager:
    def __init__(self):
        self.client_transcription = ""
        self.is_replying = False
        self.connection_open = True
        self.device = "web"
        self.is_interrupted = False
        self.start_time = time.time()
        self.tts_model = "AZURE"
        self.language_code = "en-US"
        self.voice_id = "54e3a85ac9594ffa83264b8a494b901b"
        self.last_transcription_complete_time = time.time()
        self.interrupt_event = threading.Event()
        self.add_buffer = True

        self.accumulated_data = bytearray()
        self.chunks_per_batch = 10  # initial chunks per batch
        self.buffer_count = 5  # initial buffer_count, minimum is 5
        self.last_receive_time = time.time()
        self.dynamic_adjustment_interval = 3.0
        self.last_adjustment_time = time.time()
        self.average_interval = 0.1

    def adjust_chunks_per_batch(self, current_interval):
        # Simple heuristic:
        # If data is arriving slower than expected (interval > 2x average), increase chunks_per_batch.
        # If data is arriving much faster, decrease it.
        if current_interval > 2 * self.average_interval:
            self.chunks_per_batch = min(
                self.chunks_per_batch + 5, 30
            )  # Increase up to 30
        elif current_interval < self.average_interval / 2:
            self.chunks_per_batch = max(self.chunks_per_batch - 1, 2)
        # Update the average interval (simple moving average)
        self.average_interval = (self.average_interval + current_interval) / 2

    def set_device(self, device):
        self.device = device

    async def interrupt(
        self, websocket, response_task_fish, response_task_azure, bytes_queue
    ):
        if response_task_fish is not None:
            response_task_fish.cancel()
        if response_task_azure is not None and response_task_azure.is_alive():
            # Signal the thread to stop
            self.interrupt_event.set()
            response_task_azure.join()

        # Clear any remaining data in the queue
        while not bytes_queue.empty():
            bytes_queue.get_nowait()

        await json2client(websocket, "info", self.device, "INTERRUPT")

    async def get_transcript(
        self,
        data_stream: asyncio.Queue,
        transcription_complete: asyncio.Event,
        language_code: str = "en-US",
    ):
        def handle_utterance(utterance):
            self.client_transcription = utterance

        await get_deepgram_transcript(
            handle_utterance,
            data_stream,
            transcription_complete,
            transcript_collector,
            language_code,
        )

    async def timeout_check_esp(
        self,
        websocket: WebSocket,
        transcription_complete: asyncio.Event,
        is_replying: bool,
        timeout: int = 15,
    ):
        print("timeout_check:", is_replying)
        try:
            # await asyncio.sleep(timeout - 10)
            # if (
            #     not transcription_complete.is_set()
            #     and self.client_transcription == ""
            #     and is_replying == False
            # ):
            #     print("This connection will be closed in 10 seconds...")
            #     json_data = {
            #         "type": "warning",  # Specify the type of message
            #         "audio_data": None,
            #         "text_data": "Reminder: No transcription detected, disconnecting in 10 seconds...",
            #         "boundary": None,  # Use the boundary parameter instead of sentence
            #         "task_id": None,
            #     }

            # await websocket.send_json(json_data)
            await asyncio.sleep(timeout)
            if (
                not transcription_complete.is_set()
                and self.client_transcription == ""
                and is_replying == False
            ):
                await json2client(websocket, "warning", self.device, "TIMEOUT")
                await asyncio.sleep(1)
                transcription_complete.set()
                self.connection_open = False
        except asyncio.CancelledError:
            return

    async def timeout_check_web(self, websocket, timeout=300):
        while self.connection_open:
            await asyncio.sleep(1)
            if time.time() - self.last_transcription_complete_time > timeout:
                await json2client(websocket, "warning", self.device, "TIMEOUT")
                self.connection_open = False
                await websocket.close()
                print("WebSocket disconnected due to inactivity.")
                break

    async def check_credits(self, start_time, max_time_remaining, websocket):
        session_time = time.time() - start_time
        print("Session time:", session_time, max_time_remaining)
        if session_time >= max_time_remaining:
            await websocket.send_json(
                {
                    "type": "credits_warning",
                    "audio_data": None,
                    "text_data": "You have reached the maximum session time limit. Please upgrade to premium to continue.",
                    "boundary": None,
                    "task_id": None,
                }
            )
            self.connection_open = False

    async def interrupt(self, websocket, response_task_azure, bytes_queue):

        if response_task_azure is not None and response_task_azure.is_alive():
            # Signal the thread to stop
            self.interrupt_event.set()
            response_task_azure.join()

        # Clear any remaining data in the queue
        while not bytes_queue.empty():
            bytes_queue.get_nowait()

        await json2client(websocket, "info", self.device, "INTERRUPT")

        # Reset the event after interrupting
        self.interrupt_event.clear()

    def chat_completion(
        self,
        messages: list,
        bytes_queue,
        task_id_queue,
        user,
        voice_id,
        personality_translation,
    ):
        """Retrieve text from OpenAI and pass it to the text-to-speech function."""
        response = client.client_azure_4o.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )

        accumulated_text = []
        response_text = ""
        is_start = True
        try:
            for chunk in response:
                if self.interrupt_event.is_set():
                    return

                if chunk.choices and chunk.choices[0].delta.content:
                    chunk_text = chunk.choices[0].delta.content
                    chunk_text = emoji.replace_emoji(chunk_text, replace="")
                    chunk_text = chunk_text.replace("*", "")
                    accumulated_text.append(chunk_text)
                    response_text += chunk_text
                    sentences = chunk_text_by_clause(
                        "".join(accumulated_text), self.language_code
                    )
                    sentences = [sentence for sentence in sentences if sentence]

                    if len(sentences) > 1:
                        for sentence in sentences[:-1]:
                            if self.tts_model == "AZURE":
                                azure_tts(
                                    sentence,
                                    is_start,
                                    task_id_queue,
                                    voice_id,
                                    self.device,
                                    bytes_queue,
                                    user,
                                    personality_translation,
                                )
                            else:
                                fish_tts(
                                    sentence,
                                    is_start,
                                    task_id_queue,
                                    voice_id,
                                    self.device,
                                    bytes_queue,
                                    user,
                                    personality_translation,
                                )

                            if is_start == True:
                                is_start = False

                        accumulated_text = [sentences[-1]]

            if accumulated_text:
                accumulated_text_ = "".join(accumulated_text)
                print("Sentence:", accumulated_text_)
                if self.tts_model == "AZURE":
                    azure_tts(
                        accumulated_text_,
                        is_start,
                        task_id_queue,
                        voice_id,
                        self.device,
                        bytes_queue,
                        user,
                        personality_translation,
                    )
                else:
                    fish_tts(
                        accumulated_text_,
                        is_start,
                        task_id_queue,
                        voice_id,
                        self.device,
                        bytes_queue,
                        user,
                        personality_translation,
                    )

        except Exception as e:
            print("Error in chat_completion:", e)
            response_text = get_error_prompt_prefix(self.language_code)
            if self.tts_model == "AZURE":
                azure_tts(
                    response_text,
                    is_start,
                    task_id_queue,
                    voice_id,
                    self.device,
                    bytes_queue,
                    user,
                    personality_translation,
                )
            else:
                fish_tts(
                    response_text,
                    is_start,
                    task_id_queue,
                    voice_id,
                    self.device,
                    bytes_queue,
                    user,
                    personality_translation,
                )

        enqueue_bytes(bytes_queue, self.device, "info", None, "END", "END")

        return response_text

    def speech_response(
        self,
        utterance: str,
        messages: list,
        user: dict,
        personality_translation: dict,
        task_id_queue: asyncio.Queue,
        bytes_queue: asyncio.Queue,
        is_greeting=False,
    ):

        if is_greeting:
            messages_ = messages.copy()
            messages_.append({"role": "user", "content": utterance})
            response_text = self.chat_completion(
                messages_,
                bytes_queue,
                task_id_queue,
                user,
                self.voice_id,
                personality_translation,
            )
            append_response_text(messages, "assistant", response_text)

        else:
            task_id = create_emotion_detection_task(
                f"{utterance}",
                user,
                personality_translation,
                "user",
                user["most_recent_chat_group_id"],
            )

            if self.device == "web":
                enqueue_bytes(
                    bytes_queue, self.device, "input", None, utterance, None, task_id
                )
                enqueue_task(task_id_queue, task_id)

            append_response_text(messages, "user", utterance)

            response_text = self.chat_completion(
                messages,
                bytes_queue,
                task_id_queue,
                user,
                self.voice_id,
                personality_translation,
            )

            append_response_text(messages, "assistant", response_text)

    async def get_transcript(
        self,
        data_stream: asyncio.Queue,
        transcription_complete: asyncio.Event,
        language_code: str,
    ):
        def handle_utterance(utterance):
            self.client_transcription = utterance

        await get_deepgram_transcript(
            handle_utterance,
            data_stream,
            transcription_complete,
            transcript_collector,
            language_code,
        )

    async def main_esp(
        self,
        websocket: WebSocket,
        data_stream: asyncio.Queue,
        user_data: dict,
        personality_translation: dict,
        messages: list,
    ):
        # user = User(**user_data)
        user = user_data
        task_id_queue = asyncio.Queue()
        bytes_queue = asyncio.Queue()
        self.language_code = user["language_code"]
        self.voice_id = personality_translation["voice"]["tts_code"]
        self.tts_model = personality_translation["voice"]["tts_model"]

        start_time = time.time()
        max_time_remaining = max(0, 1800 - user["session_time"])
        buffer_count = 10

        greeting = True
        speech_thread = None

        while self.connection_open:
            try:
                if greeting:

                    speech_thread = threading.Thread(
                        target=self.speech_response,
                        args=(
                            get_greeting_prompt_prefix(self.language_code),
                            messages,
                            user,
                            personality_translation,
                            task_id_queue,
                            bytes_queue,
                            True,
                        ),
                        daemon=True,
                    )
                    speech_thread.start()
                    greeting = False

                    greeting = False
                    self.is_replying = True

                if not self.is_replying:
                    transcription_complete = asyncio.Event()
                    transcription_task = asyncio.create_task(
                        self.get_transcript(
                            data_stream, transcription_complete, self.language_code
                        )
                    )
                    timeout_task = asyncio.create_task(
                        self.timeout_check_esp(
                            websocket,
                            transcription_complete,
                            self.is_replying,
                            timeout=60,
                        )
                    )
                    while not transcription_complete.is_set() and self.connection_open:
                        try:
                            message = await websocket.receive()
                            if "text" in message:
                                try:
                                    data = json.loads(message["text"])
                                    if data.get("is_ending") == True:
                                        self.connection_open = False
                                    # if data.get("is_interrupted") == True:
                                    #     self.is_interrupted = True
                                    #     break
                                    if data.get("rssi"):
                                        buffer_count = get_buffer_from_rssi(
                                            data.get("rssi")
                                        )
                                        print("buffer_count++++++", buffer_count)
                                except json.JSONDecodeError:
                                    print("Received invalid JSON")
                            if "bytes" in message:
                                data = message["bytes"]
                                # Since each incoming data is always 1024 bytes, we can just append it.
                                self.accumulated_data.extend(data)

                                # Calculate time interval between chunks
                                current_time = time.time()
                                current_interval = current_time - self.last_receive_time
                                self.last_receive_time = current_time

                                # Periodically adjust how many chunks we accumulate
                                if (
                                    current_time - self.last_adjustment_time
                                ) > self.dynamic_adjustment_interval:
                                    self.adjust_chunks_per_batch(current_interval)
                                    self.last_adjustment_time = current_time

                                # Check if we have accumulated enough data
                                # Since each chunk is 1024 bytes, the target size is `1024 * self.chunks_per_batch`
                                if len(self.accumulated_data) >= (
                                    1024 * self.chunks_per_batch
                                ):
                                    await data_stream.put(bytes(self.accumulated_data))
                                    self.accumulated_data.clear()
                        except WebSocketDisconnect:
                            self.connection_open = False
                            break

                    if transcription_complete.is_set():
                        enqueue_bytes(
                            bytes_queue,
                            self.device,
                            "info",
                            None,
                            "PROCESSING",
                            "PROCESSING",
                        )

                    transcription_complete.clear()
                    self.interrupt_event.clear()

                    transcription_task.cancel()
                    try:
                        await transcription_task
                    except asyncio.CancelledError:
                        pass

                    timeout_task.cancel()
                    try:
                        await timeout_task
                    except asyncio.CancelledError:
                        pass

                    if not self.client_transcription:
                        self.connection_open = False
                        break

                    self.is_replying = True

                    if (
                        speech_thread
                        and speech_thread.is_alive()
                        and not self.interrupt_event.is_set()
                    ):
                        self.interrupt_event.set()
                        speech_thread.join()

                    self.interrupt_event = threading.Event()
                    speech_thread = threading.Thread(
                        target=self.speech_response,
                        args=(
                            self.client_transcription,
                            messages,
                            user,
                            personality_translation,
                            task_id_queue,
                            bytes_queue,
                        ),
                        daemon=True,
                    )
                    speech_thread.start()

                    self.client_transcription = ""

                else:
                    try:
                        message = await websocket.receive()
                        if "text" in message:
                            data = json.loads(message["text"])
                            if data.get("add_buffer") == True:
                                self.add_buffer = True
                            if data.get("speech_end") == True:
                                self.is_replying = False
                            if (
                                data.get("speech_start") == True
                                and self.device == "esp"
                            ):
                                self.is_replying = True
                            if data.get("is_ending") == True and self.device == "esp":
                                print("is_ending", data.get("is_ending"))
                                self.connection_open = False
                                break
                            if data.get("is_interrupted") == True:
                                self.is_replying = False
                                await self.interrupt(
                                    websocket,
                                    speech_thread,
                                    bytes_queue,
                                )
                            if data.get("rssi"):
                                buffer_count = get_buffer_from_rssi(data.get("rssi"))
                                print("buffer_count++++++", buffer_count)

                        if self.add_buffer == True:
                            print("I am here", self.chunks_per_batch)
                            for i in range(
                                min(self.chunks_per_batch, bytes_queue.qsize())
                            ):
                                await bytes2client(websocket, bytes_queue, self.device)
                            self.add_buffer = False
                        else:
                            await bytes2client(websocket, bytes_queue, self.device)

                        if task_id_queue.qsize() > 0:
                            task_id = task_id_queue.get_nowait()
                            await check_task_result(task_id, websocket)

                    except WebSocketDisconnect:
                        self.connection_open = False
                        break

                if not user["is_premium"]:
                    await self.check_credits(start_time, max_time_remaining, websocket)

            except asyncio.TimeoutError:
                print("Timeout error")
                self.connection_open = False
                break
            except WebSocketDisconnect:
                self.connection_open = False
                break
            if not self.connection_open:
                break

    async def main_web(
        self,
        websocket: WebSocket,
        data_stream: asyncio.Queue,
        user: dict,
        personality_translation: dict,
        messages: list,
    ):
        task_id_queue = asyncio.Queue()
        bytes_queue = asyncio.Queue()

        self.language_code = user["language_code"]
        self.voice_id = personality_translation["voice"]["tts_code"]
        self.tts_model = personality_translation["voice"]["tts_model"]

        start_time = time.time()

        max_time_remaining = max(0, 1800 - user["session_time"])
        print("user session time", max_time_remaining, user["session_time"])

        greeting = True

        transcription_complete = asyncio.Event()
        transcription_task = asyncio.create_task(
            self.get_transcript(data_stream, transcription_complete, self.language_code)
        )
        asyncio.create_task(self.timeout_check_web(websocket))

        response_task_azure = None

        while self.connection_open:
            try:
                message = await websocket.receive()

                if greeting:
                    response_task_azure = threading.Thread(
                        target=self.speech_response,
                        args=(
                            get_greeting_prompt_prefix(self.language_code),
                            messages,
                            user,
                            personality_translation,
                            task_id_queue,
                            bytes_queue,
                            True,
                        ),
                        daemon=True,
                    )
                    response_task_azure.start()
                    greeting = False

                if "bytes" in message:
                    # Remove device check since this is main_web method
                    if not transcription_complete.is_set():
                        await data_stream.put(message["bytes"])

                elif "text" in message:
                    data = json.loads(message["text"])
                    if data.get("add_buffer") == True:
                        self.add_buffer = True
                    if data.get("speech_end") == True:
                        self.is_replying = False
                    # Remove ESP specific checks since this is main_web
                    if data.get("is_interrupted") == True:
                        await self.interrupt(
                            websocket,
                            response_task_azure,
                            bytes_queue,
                        )

                if transcription_complete.is_set():
                    self.last_transcription_complete_time = time.time()
                    enqueue_bytes(
                        bytes_queue,
                        self.device,
                        "info",
                        None,
                        "PROCESSING",
                        None,  # Add missing task_id parameter
                    )

                    if self.client_transcription != "":
                        await self.interrupt(
                            websocket,
                            response_task_azure,
                            bytes_queue,
                        )

                    response_task_azure = threading.Thread(
                        target=self.speech_response,
                        args=(
                            self.client_transcription,
                            messages,
                            user,
                            personality_translation,
                            task_id_queue,
                            bytes_queue,
                            False,  # Add missing is_start parameter
                        ),
                        daemon=True,
                    )
                    response_task_azure.start()

                    transcription_complete.clear()
                    self.interrupt_event.clear()
                    self.client_transcription = (
                        ""  # Clear transcription after processing
                    )

                if self.add_buffer == True:
                    for i in range(min(5, bytes_queue.qsize())):
                        await bytes2client(websocket, bytes_queue, self.device)
                    self.add_buffer = False
                else:
                    await bytes2client(websocket, bytes_queue, self.device)

                if task_id_queue.qsize() > 0:
                    task_id = task_id_queue.get_nowait()
                    await check_task_result(task_id, websocket)

                if not user["is_premium"]:
                    await self.check_credits(start_time, max_time_remaining, websocket)

            except asyncio.TimeoutError:
                print("Timeout error")
                self.connection_open = False
                break
            except WebSocketDisconnect:
                print("WebSocketDisconnect")
                self.connection_open = False
                break
            if not self.connection_open:
                break
