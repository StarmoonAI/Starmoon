import asyncio
import json
import re
import threading
import nltk
import emoji

# import pyaudio
from app.services.clients import Clients
from app.services.stt import get_deepgram_transcript
from app.services.tts import (
    azure_send_response_and_speech,
    azure_tts,
    check_task_result,
    check_task_result_hardware,
    create_emotion_detection_task,
)

from app.utils.transcription_collector import TranscriptCollector
from fastapi import WebSocket, WebSocketDisconnect

transcript_collector = TranscriptCollector()
client = Clients()
# p = pyaudio.PyAudio()


CLAUSE_BOUNDARIES = r"\.|\?|!|。|;"


def chunk_text_by_clause(text):
    # # Find clause boundaries using regular expression
    # clause_boundaries = re.finditer(CLAUSE_BOUNDARIES, text)
    # boundaries_indices = [boundary.end() for boundary in clause_boundaries]

    # chunks = []
    # start = 0
    # for boundary_index in boundaries_indices:
    #     chunks.append(text[start:boundary_index].strip())
    #     start = boundary_index
    # # Append the remaining part of the text
    # if start < len(text):
    #     chunks.append(text[start:].strip())

    # if len(chunks) > 1:
    #     chunks = nltk.sent_tokenize(text)

    return nltk.sent_tokenize(text)


class ConversationManager:
    def __init__(self):
        self.client_transcription = ""
        self.is_replying = False
        self.is_end_of_sentence = True
        self.connection_open = True
        self.device = "web"
        self.is_interrupted = False
        self.check_task_result_tasks = []  # Store tasks for check_task_result

    def set_device(self, device):
        self.device = device

    async def send_message(self, websocket: WebSocket, message):
        if self.connection_open:
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                self.connection_open = False
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
        task_id_queue: asyncio.Queue,
        bytes_queue: asyncio.Queue,
        is_greeting=False,
    ):
        # try:

        if not is_greeting:
            messages.append({"role": "user", "content": utterance})
            response = client.client_azure_4o.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                stream=True,
            )
            # send utterance to celery task
            task_id = create_emotion_detection_task(
                f"{previous_sentence}\n\n{utterance}", user, "user", session_id
            )
            if device == "web":
                bytes_queue.put_nowait(
                    {
                        "type": "json",
                        "device": device,
                        "data": {
                            "type": "input",
                            "audio_data": None,
                            "text_data": utterance,
                            "boundary": None,
                            "task_id": task_id,
                        },
                    }
                )
                # add id to the queue
                task_id_queue.put_nowait(task_id)
                # task = asyncio.create_task(check_task_result_hardware(task_id, text_queue))
                # # ! will check tasks in the main loop
                # self.check_task_result_tasks.append(task)
        else:
            messages_ = messages.copy()
            messages_.append({"role": "user", "content": utterance})
            response = client.client_azure_4o.chat.completions.create(
                model="gpt-4o",
                messages=messages_,
                stream=True,
                temperature=1,
            )

        accumulated_text = []
        response_text = ""
        is_first_chunk = True
        previous_sentence = utterance

        for chunk in response:
            if self.is_interrupted or stop_event.is_set() or not self.connection_open:
                self.is_interrupted = False
                # clear bytes_queue
                while not bytes_queue.empty():
                    bytes_queue.get_nowait()
                self.check_task_result_tasks.clear()
                break

            if chunk.choices and chunk.choices[0].delta.content:
                chunk_text = emoji.replace_emoji(
                    chunk.choices[0].delta.content, replace=""
                )
                accumulated_text.append(chunk_text)
                response_text += chunk_text
                sentences = chunk_text_by_clause("".join(accumulated_text))
                sentences = [sentence for sentence in sentences if sentence]

                if len(sentences) > 1:
                    for sentence in sentences[:-1]:
                        if is_first_chunk:
                            boundary = "start"
                        # elif chunk.choices[0]["finish_reason"] == "stop":
                        #     boundary = "end"
                        else:
                            boundary = "mid"
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
                            bytes_queue,
                        )

                        bytes_queue
                        if device == "web":
                            task_id_queue.put_nowait(task_id)
                            # task = asyncio.create_task(
                            #     check_task_result_hardware(task_id, text_queue)
                            # )
                            # self.check_task_result_tasks.append(task)
                        previous_sentence = sentence
                        is_first_chunk = False

                        bytes_queue.put_nowait(
                            {
                                "type": "info",
                                "device": device,
                                "data": "END_OF_SENTENCE",
                            }
                        )

                    accumulated_text = [sentences[-1]]

        if accumulated_text and (not self.is_interrupted or not stop_event.is_set()):
            accumulated_text_ = "".join(accumulated_text)
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
                bytes_queue,
            )
            if device == "web":
                task_id_queue.put_nowait(task_id)
            previous_sentence = accumulated_text_

        bytes_queue.put_nowait(
            {
                "type": "info",
                "device": device,
                "data": "END_OF_SENTENCE",
            }
        )

        bytes_queue.put_nowait({"type": "info", "device": device, "data": "END"})
        messages.append({"role": "assistant", "content": response_text})

        # except Exception as e:
        #     print(f"Error in speech_stream_response: {e}")
        #     error_message = "Oops, it looks like we encountered some sensitive content, how about we talk about other topics?"
        #     task_id = create_emotion_detection_task(
        #         error_message, user, "assistant", session_id, is_sensitive=True
        #     )

        #     azure_tts(
        #         error_message,
        #         "end",
        #         task_id,
        #         user["toy_id"],
        #         device,
        #         bytes_queue,
        #     )
        #     if device == "web":
        #         task_id_queue.put_nowait(task_id)
        #     previous_sentence = error_message

        #     bytes_queue.put_nowait({"type": "info", "device": device, "data": "END"})
        #     messages.append({"role": "assistant", "content": error_message})

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
        print("timeout_check:", is_replying)
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
                and is_replying == False
            ):
                json_data = json.dumps(
                    {
                        "type": "warning",  # Specify the type of message
                        "audio_data": None,
                        "text_data": "OFF",
                        "boundary": None,
                        "task_id": None,
                    }
                )
                await self.send_message(websocket, json_data)
                await asyncio.sleep(0)
                transcription_complete.set()
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
        # stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, output=True)
        speech_thread = None
        speech_thread_stop_event = None
        task_id_queue = asyncio.Queue()
        bytes_queue = asyncio.Queue()

        # # send ws metadata
        # await self.send_message(websocket, json.dumps({"type": "metadata", "text_data": user["volume_control"]}))

        greeding = True

        while True:
            try:
                if greeding:
                    self.speech_response(
                        previous_sentence,
                        "Given the above chat history, user information and your responsibilities and character persona, generate ONLY ONE short greeting sentence that conatain some basic user information, interests or open questions to user:",
                        messages,
                        user,
                        user["most_recent_chat_group_id"],
                        self.device,
                        threading.Event(),
                        task_id_queue,
                        bytes_queue,
                        is_greeting=True,
                    )
                    greeding = False
                    self.is_replying = True

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
                            timeout=60,
                        )
                    )

                    while not transcription_complete.is_set() and self.connection_open:
                        try:
                            message = await websocket.receive()
                            # TODO ! add send text_queue !!!!!
                            if task_id_queue.qsize() > 0:
                                task_id = task_id_queue.get_nowait()
                                await check_task_result(task_id, websocket)
                            if message["type"] == "websocket.receive":
                                if "text" in message:
                                    try:
                                        data = json.loads(message["text"])
                                        if data.get("is_ending") == True:
                                            self.connection_open = False
                                            break
                                        if data.get("is_interrupted") == True:
                                            # self.is_interrupted = True
                                            break
                                    except json.JSONDecodeError:
                                        print("Received invalid JSON")
                                elif "bytes" in message:
                                    data = message["bytes"]
                                    # print("received bytes")
                                    await data_stream.put(data)
                                    # stream.write(data)
                        except WebSocketDisconnect:
                            self.connection_open = False
                            break

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

                    if not self.connection_open:
                        break

                    if not self.client_transcription:
                        self.connection_open = False
                        break

                    self.is_replying = True

                    if (
                        speech_thread
                        and speech_thread.is_alive()
                        and not speech_thread_stop_event.is_set()
                    ):
                        # Signal the existing thread to stop
                        speech_thread_stop_event.set()
                        # Optionally wait for the thread to finish
                        speech_thread.join()
                    # Create a new stop event for the new thread
                    speech_thread_stop_event = threading.Event()

                    speech_thread = threading.Thread(
                        target=self.speech_response,
                        args=(
                            previous_sentence,
                            self.client_transcription,
                            messages,
                            user,
                            user["most_recent_chat_group_id"],
                            self.device,
                            speech_thread_stop_event,
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
                        # deque task_id_queue
                        if task_id_queue.qsize() > 0:
                            task_id = task_id_queue.get_nowait()
                            await check_task_result(task_id, websocket)
                        if message["type"] == "websocket.receive":
                            if "bytes" in message:
                                data = message["bytes"]
                                # stream.write(data)
                                # Process incoming audio data if needed such as voice interruption
                            elif "text" in message:
                                print("message----", message)
                                try:
                                    data = json.loads(message["text"])
                                    if data.get("is_ending") == True:
                                        # disconnect the websocket
                                        self.connection_open = False
                                        # speech_thread.join()

                                    if data.get("is_replying") == False:
                                        #  wait 0.1s
                                        # await asyncio.sleep(0.5)
                                        self.is_replying = False
                                        transcript_collector.reset()
                                    if data.get("is_interrupted") == True:
                                        print(
                                            "interrupted!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                        )
                                        # self.is_interrupted = False
                                        bytes_queue = asyncio.Queue()
                                        self.is_replying = False
                                        # transcription_complete = asyncio.Event()
                                    if data.get("is_end_of_sentence") == True:
                                        self.is_end_of_sentence = True

                                except json.JSONDecodeError:
                                    print("Received invalid JSON")

                            if bytes_queue.qsize() > 0:
                                response_data = bytes_queue.get_nowait()
                                if response_data["type"] == "bytes":
                                    if self.is_end_of_sentence:
                                        for i in range(min(20, bytes_queue.qsize())):
                                            response_data = bytes_queue.get_nowait()
                                            if response_data["type"] == "bytes":
                                                await websocket.send_bytes(
                                                    response_data["data"]
                                                )
                                            else:
                                                await websocket.send_text(
                                                    response_data["data"]
                                                )
                                        self.is_end_of_sentence = False
                                    else:
                                        await websocket.send_bytes(
                                            response_data["data"]
                                        )

                                elif response_data["type"] == "json":
                                    await websocket.send_json(
                                        json.dumps(response_data["data"])
                                    )
                                    if bytes_queue.qsize() == 0:
                                        #     self.is_replying = False
                                        transcript_collector.reset()

                                else:
                                    print("response_data-++++++++--")
                                    await websocket.send_text(response_data["data"])

                    except WebSocketDisconnect:
                        self.connection_open = False
                        break

            except asyncio.TimeoutError:
                # No message received, continue the loop
                pass
            except WebSocketDisconnect:
                self.connection_open = False
                break
            if not self.connection_open:
                break
