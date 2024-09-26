import asyncio
import json
import re
import threading

import emoji
from app.services.clients import Clients
from app.services.stt import get_deepgram_transcript
from app.services.tts import (
    azure_send_response_and_speech,
    check_task_result,
    create_emotion_detection_task,
)

# from app.services.tts import speech_stream_response
from app.utils.transcription_collector import TranscriptCollector
from fastapi import WebSocket, WebSocketDisconnect

transcript_collector = TranscriptCollector()
client = Clients()


CLAUSE_BOUNDARIES = r"\.|\?|!|。|;|, (and|but|or|nor|for|yet|so)"


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


class ConversationManager:
    def __init__(self):
        self.client_transcription = ""
        self.is_replying = False
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

    def run_speech_task(self, previous_sentence, websocket, messages, user):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        previous_sentence = loop.run_until_complete(
            self.speech_stream_response(
                previous_sentence,
                self.client_transcription,
                websocket,
                messages,
                user,
                user["most_recent_chat_group_id"],
                self.device,
            )
        )

        loop.close()
        # self.is_replying = False
        return previous_sentence

    async def speech_stream_response(
        self,
        previous_sentence: str,
        utterance: str,
        websocket: WebSocket,
        messages: list,
        user: dict,
        session_id: str,
        device: str,
    ):
        # try:
        messages.append({"role": "user", "content": utterance})
        response = client.client_azure_4o.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )

        # send utterance to celery task
        task_id_input = create_emotion_detection_task(
            f"{previous_sentence}\n\nutterance", user, "user", session_id
        )

        if device == "web":
            # Send the utterance to client
            await websocket.send_json(
                json.dumps(
                    {
                        "type": "input",
                        "audio_data": None,
                        "text_data": utterance,
                        "boundary": None,
                        "task_id": task_id_input,
                    }
                )
            )
            task = asyncio.create_task(check_task_result(task_id_input, websocket))
            self.check_task_result_tasks.append(task)

        accumulated_text = []
        response_text = ""
        is_first_chunk = True
        previous_sentence = utterance

        for chunk in response:
            if self.is_interrupted:
                self.is_interrupted = False
                # cancel check_task_result task
                # Cancel all check_task_result tasks
                for task in self.check_task_result_tasks:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                self.check_task_result_tasks.clear()
                break
            if self.connection_open == False:
                break

            if chunk.choices and chunk.choices[0].delta.content:
                chunk_text = emoji.replace_emoji(
                    chunk.choices[0].delta.content, replace=""
                )
                # print("CONTENT:", chunk_text)
                accumulated_text.append(chunk_text)
                response_text += chunk_text
                sentences = chunk_text_by_clause("".join(accumulated_text))
                # sentences = re.split(r"(?<=[.。!?])\s+", "".join(accumulated_text))
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
                        await azure_send_response_and_speech(
                            sentence,
                            boundary,
                            websocket,
                            task_id,
                            user["toy_id"],
                            device,
                        )
                        await asyncio.sleep(0)
                        if device == "web":
                            task = asyncio.create_task(
                                check_task_result(task_id, websocket)
                            )
                            self.check_task_result_tasks.append(task)
                        previous_sentence = sentence
                    accumulated_text = [sentences[-1]]

        if accumulated_text:
            accumulated_text_ = "".join(accumulated_text)
            print("RESPONSE+", accumulated_text_)
            task_id = create_emotion_detection_task(
                f"{previous_sentence}\n\n{accumulated_text_}",
                user,
                "assistant",
                session_id,
            )
            await azure_send_response_and_speech(
                accumulated_text_,
                "end",
                websocket,
                task_id,
                user["toy_id"],
                device,
            )
            await asyncio.sleep(0)
            if device == "web":
                task = asyncio.create_task(check_task_result(task_id, websocket))
                self.check_task_result_tasks.append(task)
            previous_sentence = accumulated_text

        messages.append({"role": "assistant", "content": response_text})

        return previous_sentence

    # except Exception as e:
    #     print(f"Error in speech_stream_response: {e}")

    #     task_id = create_emotion_detection_task(
    #         utterance,
    #         user,
    #         "assistant",
    #         session_id,
    #         True,
    #     )
    #     if device == "web":
    #         task = asyncio.create_task(check_task_result(task_id, websocket))
    #         self.check_task_result_tasks.append(task)

    #     error_message = "Oops, it looks like we encountered some sensitive content, how about we talk about other topics?"
    #     task_id = create_emotion_detection_task(
    #         error_message,
    #         user,
    #         "assistant",
    #         session_id,
    #         True,
    #     )
    #     await azure_send_response_and_speech(
    #         error_message,
    #         "end",
    #         websocket,
    #         task_id,
    #         user["toy_id"],
    #         device,
    #     )
    #     await asyncio.sleep(0)
    #     task = asyncio.create_task(check_task_result(task_id, websocket))
    #     self.check_task_result_tasks.append(task)

    #     # TODO don't add this message to the messages list
    #     messages.pop()

    #     return None

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

        while True:
            try:
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

                    print("+++++++++++++++++++++++++++++++++++++++++++++++++")
                    print(transcription_complete.is_set())
                    print("+++++++++++++++++++++++++++++++++++++++++++++++++")

                    while not transcription_complete.is_set() and self.connection_open:
                        try:
                            message = await websocket.receive()
                            if message["type"] == "websocket.receive":
                                if "text" in message:
                                    try:
                                        data = json.loads(message["text"])
                                        print("message++++", data)
                                        if data.get("is_ending") == True:
                                            self.connection_open = False
                                            break
                                        if data.get("is_interrupted") == True:
                                            print(
                                                "interrupted!11111!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                                            )
                                            self.is_interrupted = True
                                    except json.JSONDecodeError:
                                        print("Received invalid JSON")
                                elif "bytes" in message:
                                    data = message["bytes"]
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
                    # get the return of create_task and send celery task
                    # speech_thread = threading.Thread(
                    #     target=self.run_speech_task,
                    #     args=(previous_sentence, websocket, messages, user),
                    # )
                    # speech_thread.start()
                    await self.speech_stream_response(
                        previous_sentence,
                        self.client_transcription,
                        websocket,
                        messages,
                        user,
                        user["most_recent_chat_group_id"],
                        self.device,
                    )
                    self.client_transcription = ""

                else:
                    message = await asyncio.wait_for(websocket.receive(), timeout=0.1)
                    if message["type"] == "websocket.receive":
                        if "bytes" in message:
                            data = message["bytes"]
                            # Process incoming audio data if needed
                        elif "text" in message:
                            print("message----", message)
                            try:
                                data = json.loads(message["text"])
                                if data.get("is_ending") == True:
                                    # disconnect the websocket
                                    self.connection_open = False
                                    # speech_thread.join()

                                if data.get("is_replying") == False:
                                    self.is_replying = False
                                    transcript_collector.reset()
                                if data.get("is_interrupted") == True:
                                    print("interrupted!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                                    # self.is_interrupted = False
                                    self.is_replying = False
                                    # transcription_complete = asyncio.Event()
                            except json.JSONDecodeError:
                                print("Received invalid JSON")
            except asyncio.TimeoutError:
                # No message received, continue the loop
                pass
            except WebSocketDisconnect:
                self.connection_open = False
                break
            if not self.connection_open:
                break
