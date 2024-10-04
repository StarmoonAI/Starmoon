import asyncio
import os

from app.core.auth import authenticate_user
from app.db.conversations import get_msgs
from app.db.personalities import get_personality
from app.prompt.sys_prompt import BLOOD_TEST, SYS_PROMPT_PREFIX
from app.services.clients import Clients
from app.utils.ws_connection_manager import ConnectionManager
from app.utils.ws_conversation_manager import ConversationManager
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_manager = ConversationManager()
    data_stream = asyncio.Queue()
    try:
        # ! 0 authenticate
        payload = await websocket.receive_json()
        print(payload)
        user = await authenticate_user(payload["token"], payload["user_id"])
        print(user)
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

        personality = (await get_personality(user["personality_id"])).data

        title = personality["title"]
        subtitle = personality["subtitle"]
        trait = personality["trait"]

        messages.append(
            {
                "role": "system",
                "content": f"YOU ARE TALKING TO {supervisee_name} aged {supervisee_age} with a personality described as: {supervisee_persona}  \n\nYOU ARE: A character named {title} known for {subtitle}. This is your character persona: {trait}\n\n Act with the best of intentions using Cognitive Behavioral Therapy techniques to help people feel safe and secure. Do not ask for personal information. Your physical form is in the form of a physical object or a toy. A person interacts with you by pressing a button, sends you instructions and you must respond with a conversational style. \n\n {SYS_PROMPT_PREFIX} \n",
            },
        )
        await conversation_manager.main(
            websocket,
            data_stream,
            user,
            messages,
        )

    except WebSocketDisconnect:
        conversation_manager.connection_open = False
    except Exception as e:
        conversation_manager.connection_open = False
        print(f"Error in websocket_endpoint: {e}")
    finally:
        manager.disconnect(websocket)
