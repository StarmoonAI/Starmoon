import asyncio
import base64
import json
import re
import threading
import time

import emoji
import nltk
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
    text_to_speech_stream,
)
from app.utils.enqueue import enqueue_bytes, enqueue_task
from app.utils.transcription_collector import TranscriptCollector
from app.utils.utils import append_response_text
from fastapi import WebSocket, WebSocketDisconnect

# from RealtimeTTS import AzureEngine, ElevenlabsEngine, SystemEngine, TextToAudioStream
# from stream2sentence import generate_sentences, generate_sentences_async, init_tokenizer

# from app.models.user import User
transcript_collector = TranscriptCollector()
client = Clients()
# p = pyaudio.PyAudio()


CLAUSE_BOUNDARIES = r"\.|\?|!|。|;"
GREETING_PROMPT = "Given the above chat history, user information and your responsibilities and character persona, generate ONLY ONE short greeting sentence that conatain some basic user information, interests or open questions to user:"


def chunk_text_by_clause(text):
    return nltk.sent_tokenize(text)


async def chat_completion_fish(
    messages: list,
    bytes_queue,
    task_id_queue,
    user,
    device,
    voice_id,
    personality_translation,
):
    """Retrieve text from OpenAI and pass it to the text-to-speech function."""
    response = await client.aclient_azure_4o.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
    )

    async def text_iterator():
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                delta = chunk.choices[0].delta
                yield delta.content

    response_text = await text_to_speech_stream(
        text_iterator(),
        bytes_queue,
        task_id_queue,
        user,
        device,
        voice_id,
        personality_translation,
        messages,
    )

    print("Fish response++++++++", response_text)

    return response_text


async def bytes2client(websocket: WebSocket, bytes_queue: asyncio.Queue, device: str):
    # try:
    if bytes_queue.qsize() > 0:
        if device == "web":
            response_data = bytes_queue.get_nowait()
            await websocket.send_json((response_data["data"]))
        else:
            # if add_buffer:
            #     for i in range(min(20, bytes_queue.qsize())):
            #         response_data = bytes_queue.get_nowait()
            #         if response_data["data"]["audio_data"]:
            #             await websocket.send_bytes(
            #                 response_data["data"]["audio_data"]
            #             )
            #         else:
            #             await websocket.send_json(response_data["data"])
            #     add_buffer = False

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
        self.voice_id = "54e3a85ac9594ffa83264b8a494b901b"
        self.last_transcription_complete_time = time.time()
        self.interrupt_event = threading.Event()
        self.add_buffer = True

    def set_device(self, device):
        self.device = device

    async def interrupt(
        self, websocket, response_task_fish, response_task_azure, bytes_queue
    ):
        if response_task_fish and not response_task_fish.done():
            response_task_fish.cancel()
        if response_task_azure is not None and response_task_azure.is_alive():
            # Signal the thread to stop
            self.interrupt_event.set()
            response_task_azure.join()

        # Clear any remaining data in the queue
        while not bytes_queue.empty():
            bytes_queue.get_nowait()

        await json2client(websocket, "info", self.device, "INTERRUPT")

    def chat_completion_azure(
        self,
        messages: list,
        bytes_queue,
        task_id_queue,
        user,
        device,
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

        enqueue_bytes(bytes_queue, device, "info", None, "START", "START")

        for chunk in response:
            if self.interrupt_event.is_set():
                return

            if chunk.choices and chunk.choices[0].delta.content:
                chunk_text = chunk.choices[0].delta.content
                chunk_text = emoji.replace_emoji(chunk_text, replace="")
                chunk_text = chunk_text.replace("*", "")
                accumulated_text.append(chunk_text)
                response_text += chunk_text
                sentences = chunk_text_by_clause("".join(accumulated_text))
                sentences = [sentence for sentence in sentences if sentence]

                if len(sentences) > 1:
                    for sentence in sentences[:-1]:
                        azure_tts(
                            sentence,
                            None,
                            task_id_queue,
                            voice_id,
                            device,
                            bytes_queue,
                            user,
                            personality_translation,
                        )

                    accumulated_text = [sentences[-1]]

        if accumulated_text:
            accumulated_text_ = "".join(accumulated_text)
            print("Sentence:", accumulated_text_)
            azure_tts(
                accumulated_text_,
                None,
                task_id_queue,
                voice_id,
                device,
                bytes_queue,
                user,
                personality_translation,
            )

        enqueue_bytes(bytes_queue, device, "info", None, "END", "END")

        return response_text

    async def speech_response_fish(
        self,
        utterance: str,
        messages: list,
        user: dict,
        personality_translation: dict,
        device: str,
        task_id_queue: asyncio.Queue,
        bytes_queue: asyncio.Queue,
        is_greeting=False,
    ):
        # tts_code = personality_translation["voice"]["tts_code"]

        if is_greeting:
            messages_ = messages.copy()

            messages_.append({"role": "user", "content": utterance})

            response_text = await chat_completion_fish(
                messages_,
                bytes_queue,
                task_id_queue,
                user,
                device,
                self.voice_id,
                personality_translation,
            )
            # append_response_text(messages, "assistant", response_text)

        else:
            task_id = create_emotion_detection_task(
                f"{utterance}",
                user,
                personality_translation,
                "user",
                user["most_recent_chat_group_id"],
            )

            if device == "web":
                enqueue_bytes(
                    bytes_queue, device, "input", None, utterance, None, task_id
                )
                enqueue_task(task_id_queue, task_id)

            append_response_text(messages, "user", utterance)

            response_text = await chat_completion_fish(
                messages,
                bytes_queue,
                task_id_queue,
                user,
                device,
                self.voice_id,
                personality_translation,
            )
            # append_response_text(messages, "assistant", response_text)

        # previous_sentence = response_text

    def speech_response_azure(
        self,
        utterance: str,
        messages: list,
        user: dict,
        personality_translation: dict,
        device: str,
        task_id_queue: asyncio.Queue,
        bytes_queue: asyncio.Queue,
        is_greeting=False,
    ):

        if is_greeting:
            messages_ = messages.copy()
            messages_.append({"role": "user", "content": utterance})
            response_text = self.chat_completion_azure(
                messages_,
                bytes_queue,
                task_id_queue,
                user,
                device,
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

            if device == "web":
                enqueue_bytes(
                    bytes_queue, device, "input", None, utterance, None, task_id
                )
                enqueue_task(task_id_queue, task_id)

            append_response_text(messages, "user", utterance)

            response_text = self.chat_completion_azure(
                messages,
                bytes_queue,
                task_id_queue,
                user,
                device,
                self.voice_id,
                personality_translation,
            )

            append_response_text(messages, "assistant", response_text)

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

    async def monitor_timeout(self, websocket, timeout=300):
        while self.connection_open:
            await asyncio.sleep(1)
            if time.time() - self.last_transcription_complete_time > timeout:
                await json2client(websocket, "warning", self.device, "TIMEOUT")
                self.connection_open = False
                await websocket.close()
                print("WebSocket disconnected due to inactivity.")
                break

    async def check_credits(self, start_time, max_time, websocket):
        session_time = time.time() - start_time
        print("Session time:", session_time, max_time)
        if session_time >= max_time:
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

    async def main(
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
        language_code = user["language_code"]
        self.voice_id = personality_translation["voice"]["tts_code"]
        tts_model = personality_translation["voice"]["tts_model"]

        start_time = time.time()
        max_time = max(0, 1800 - (start_time - user["session_time"]))

        greeding = True

        transcription_complete = asyncio.Event()
        transcription_task = asyncio.create_task(
            self.get_transcript(data_stream, transcription_complete, language_code)
        )
        # asyncio.create_task(self.monitor_timeout(websocket))  # Start monitoring task

        response_task_fish = None
        response_task_azure = None

        while self.connection_open:
            try:
                message = await websocket.receive()

                if greeding:
                    if tts_model == "AZURE":
                        response_task_azure = threading.Thread(
                            target=self.speech_response_azure,
                            args=(
                                get_greeting_prompt_prefix(language_code),
                                messages,
                                user,
                                personality_translation,
                                self.device,
                                task_id_queue,
                                bytes_queue,
                                True,
                            ),
                            daemon=True,
                        )
                        response_task_azure.start()
                    else:
                        print("Creating fish task")
                        response_task_fish = asyncio.create_task(
                            self.speech_response_fish(
                                get_greeting_prompt_prefix(language_code),
                                messages,
                                user,
                                personality_translation,
                                self.device,
                                task_id_queue,
                                bytes_queue,
                                is_greeting=True,
                            )
                        )
                    greeding = False

                    await bytes2client(websocket, bytes_queue, self.device)

                if "bytes" in message:
                    if self.device == "web":
                        if not transcription_complete.is_set():
                            await data_stream.put(message["bytes"])
                    else:
                        if not self.is_replying and not transcription_complete.is_set():
                            await data_stream.put(message["bytes"])

                elif "text" in message:
                    data = json.loads(message["text"])
                    if data.get("add_buffer") == True:
                        self.add_buffer = True
                    if data.get("speech_end") == True:
                        self.is_replying = False
                        transcription_task.cancel()
                        try:
                            await transcription_task
                        except asyncio.CancelledError:
                            print("transcription_task cancelled !!!")
                    if data.get("speech_start") == True:
                        # ! if transcription_task is existing, don't create a new one
                        if not transcription_task.done():
                            transcription_task = asyncio.create_task(
                                self.get_transcript(
                                    data_stream, transcription_complete, language_code
                                )
                            )
                        self.is_replying = True
                    if data.get("is_ending") == True:
                        print("is_ending", data.get("is_ending"))
                        self.connection_open = False
                        break

                if transcription_complete.is_set():
                    self.last_transcription_complete_time = time.time()

                    if self.client_transcription != "":
                        await self.interrupt(
                            websocket,
                            response_task_fish,
                            response_task_azure,
                            bytes_queue,
                        )

                    if tts_model == "AZURE":
                        response_task_azure = threading.Thread(
                            target=self.speech_response_azure,
                            args=(
                                self.client_transcription,
                                messages,
                                user,
                                personality_translation,
                                self.device,
                                task_id_queue,
                                bytes_queue,
                            ),
                            daemon=True,
                        )
                        response_task_azure.start()

                    else:
                        response_task_fish = asyncio.create_task(
                            self.speech_response_fish(
                                self.client_transcription,
                                messages,
                                user,
                                personality_translation,
                                self.device,
                                task_id_queue,
                                bytes_queue,
                            )
                        )

                    # reset the event
                    transcription_complete.clear()
                    self.interrupt_event.clear()

                # if self.add_buffer == True:
                #     for i in range(min(5, bytes_queue.qsize())):
                #         await bytes2client(websocket, bytes_queue, self.device)
                #     self.add_buffer = False
                # else:
                await bytes2client(websocket, bytes_queue, self.device)

                if task_id_queue.qsize() > 0:
                    task_id = task_id_queue.get_nowait()
                    await check_task_result(task_id, websocket)

                if not user["is_premium"]:
                    await self.check_credits(start_time, max_time, websocket)

            except asyncio.TimeoutError:
                print("Timeout error")
                self.connection_open = False
                break
            except WebSocketDisconnect:
                self.connection_open = False
                break
            if not self.connection_open:
                break
