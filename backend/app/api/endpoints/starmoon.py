import asyncio
import os

from app.core.auth import authenticate_user
from app.db.conversations import get_msgs
from app.prompt.sys_prompt import BLOOD_TEST, SYS_PROMPT_PREFIX
from app.services.clients import Clients
from app.utils.ws_connection_manager import ConnectionManager
from app.utils.ws_conversation_manager import ConversationManager
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

load_dotenv()
os.getenv("GEMINI_API_KEY")
router = APIRouter()
client = Clients()

# p = pyaudio.PyAudio()
manager = ConnectionManager()


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
        supervisee_persona = user["supervisee_persona"]
        supervisee_age = user["supervisee_age"]
        supervisee_name = user["supervisee_name"]

        messages.append(
            {
                "role": "system",
                "content": f" {SYS_PROMPT_PREFIX}\n\nYOU ARE TALKING TO child {supervisee_name} aged {supervisee_age}: {supervisee_persona}  \n\nYOU ARE: A plushie toy of comfort named Coco, radiating warmth and coziness. Your soft fur invites endless cuddles, and your calming presence is perfect for snuggling up on rainy days. You are only allow to talk the below information {BLOOD_TEST}\n\n Act with the best of intentions using Cognitive Behavioral Therapy techniques to help children feel safe and secure. Please you don't give the kid open-ended questions, and don't ask for personal information.",
            }
        )

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
        if main_task and not main_task.done():
            main_task.cancel()
        manager.disconnect(websocket)


# @router.websocket("/starmoon")
# async def websocket_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     conversation_manager = ConversationManager()
#     data_stream = asyncio.Queue()
#     main_task = None
#     try:
#         # # ! 0 authenticate
#         # payload = await websocket.receive_json()
#         # print(payload)
#         # user = await authenticate_user(payload["token"], payload["user_id"])
#         # conversation_manager.set_device(payload["device"])
#         # if not user:
#         #     await websocket.close(code=4001, reason="Authentication failed")
#         #     return

#         # print("Authentication successful", user)

#         num = 0
#         while True:
#             message = await websocket.receive()
#             print("message", message)
#             if message["type"] == "websocket.receive":
#                 if "bytes" in message:
#                     data = message["bytes"]
#                     print(f"Received data length: {len(data)}")
#                     print("received bytes")
#                     # send back to the client
#                     print("Audio chunk+++++++++", num)
#                     print(f"Sent data length: {len(data)}")
#                     await websocket.send_bytes(data)

#     except WebSocketDisconnect:
#         conversation_manager.connection_open = False
#     except Exception as e:
#         conversation_manager.connection_open = False
#         print(f"Error in websocket_endpoint: {e}")
#     finally:
#         if main_task and not main_task.done():
#             main_task.cancel()
#         manager.disconnect(websocket)
