import asyncio
import json
import os

# from app.celery.tasks import speech_stream_response_task
from app.core.auth import authenticate_user
from app.db.conversations import get_msgs

# from app.models.schema import Conversations, Users
from app.prompt.sys_prompt import BLOOD_TEST, SYS_PROMPT_PREFIX
from app.services.stt import get_deepgram_transcript
from app.services.tts import speech_stream_response
from app.utils.transcription_collector import TranscriptCollector
from app.utils.ws_connection_manager import ConnectionManager
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

load_dotenv()
os.getenv("GEMINI_API_KEY")
router = APIRouter()

transcript_collector = TranscriptCollector()
# p = pyaudio.PyAudio()
manager = ConnectionManager()


class ConversationManager:
    def __init__(self):
        self.client_transcription = ""
        self.is_replying = False
        self.connection_open = True
        self.device = "web"

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
        timeout: int = 15,
    ):
        try:
            await asyncio.sleep(timeout - 10)
            if not transcription_complete.is_set() and self.client_transcription == "":
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
            if not transcription_complete.is_set() and self.client_transcription == "":
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
            if not self.is_replying:
                transcription_complete = asyncio.Event()
                transcription_task = asyncio.create_task(
                    self.get_transcript(data_stream, transcription_complete)
                )

                if self.device == "web":
                    timeout_task = asyncio.create_task(
                        self.timeout_check(
                            websocket, transcription_complete, timeout=30
                        )
                    )

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

                if self.device == "web":
                    timeout_task.cancel()

                if not self.connection_open:
                    break

                if not self.client_transcription:
                    # await websocket.send_text(
                    #     "No transcription detected, disconnecting..."
                    # )
                    self.connection_open = False
                    break

                self.is_replying = True

                # get the return of create_task and send celery task
                to_speech_task = asyncio.create_task(
                    speech_stream_response(
                        previous_sentence,
                        self.client_transcription,
                        websocket,
                        messages,
                        user,
                        user["most_recent_chat_group_id"],
                        self.device,
                    )
                )
                previous_sentence = await to_speech_task

                self.client_transcription = ""

            else:
                # print("is replying")
                transcription_complete.set()
                transcription_task.cancel()
                # do other process + interrupt detection (no deepgram)
                message = await websocket.receive()
                if message["type"] == "websocket.receive":
                    if "bytes" in message:
                        data = message["bytes"]
                    elif "text" in message:
                        print("message++++", message)
                        try:
                            data = json.loads(message["text"])
                            if data.get("is_replying") == False:
                                self.is_replying = False
                                transcript_collector.reset()
                        except json.JSONDecodeError:
                            print("Received invalid JSON")


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_manager = ConversationManager()
    data_stream = asyncio.Queue()
    main_task = None
    try:
        # ! 0 authenticate
        payload = await websocket.receive_json()
        print(payload)
        user = await authenticate_user(payload["token"], payload["user_id"])
        conversation_manager.set_device(payload["device"])
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        print("Authentication successful", user)

        messages = []

        chat_history = await get_msgs(user["user_id"], user["toy_id"])

        for chat in chat_history.data:
            messages.append(
                {
                    "role": chat["role"],
                    "content": chat["content"],
                }
            )
        child_persona = user["child_persona"]
        child_age = user["child_age"]
        child_name = user["child_name"]

        messages.append(
            {
                "role": "system",
                "content": f" {SYS_PROMPT_PREFIX}\n\nYOU ARE TALKING TO child {child_name} aged {child_age}: {child_persona}  \n\nYOU ARE: A plushie toy of comfort named Coco, radiating warmth and coziness. Your soft fur invites endless cuddles, and your calming presence is perfect for snuggling up on rainy days. You are only allow to talk the below information {BLOOD_TEST}\n\n Act with the best of intentions using Cognitive Behavioral Therapy techniques to help children feel safe and secure. Please you don't give the kid open-ended questions, and don't ask for personal information.",
            }
        )

        # messages.append(
        #     {
        #         "role": "system",
        #         "content": f" {SYS_PROMPT_PREFIX}\n\nYOU ARE TALKING TO child {child_name} aged {child_age}: {child_persona}  \n\nYOU ARE: A plushie toy of comfort named Coco, radiating warmth and coziness. Your soft fur invites endless cuddles, and your calming presence is perfect for snuggling up on rainy days.",
        #     }
        # )

        main_task = asyncio.create_task(
            conversation_manager.main(
                websocket,
                data_stream,
                user,
                messages,
            )
        )
        await main_task

    except WebSocketDisconnect:
        conversation_manager.connection_open = False
    except Exception as e:
        conversation_manager.connection_open = False
        print(f"Error in websocket_endpoint: {e}")
    finally:
        # if main_task and not main_task.done():
        #     main_task.cancel()
        manager.disconnect(websocket)
