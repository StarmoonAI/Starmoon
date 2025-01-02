import asyncio
import json
import traceback

from app.core.auth import authenticate_user
from app.db.conversations import get_msgs
from app.db.personalities import get_personality
from app.prompt.conversation_prompt import (
    get_language_spoken_prompt_prefix,
    get_personality_prompt_prefix,
    get_user_native_language_prompt_prefix,
)
from app.prompt.doctor_prompt import get_doctor_prompt_prefix
from app.prompt.sys_prompt import SYS_PROMPT_PREFIX
from app.prompt.user_prompt import get_user_prompt_prefix
from app.utils.languages import (
    get_personality_translation,
    get_personality_translation_by_id,
)
from app.utils.ws_connection_manager import ConnectionManager
from app.utils.ws_conversation_manager import ConversationManager
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_manager = ConversationManager()
    data_stream = asyncio.Queue()
    try:
        # Step 1: Send connection acknowledgement
        # await websocket.send_json({"type": "connection_ack"})

        # ! 0 authenticate
        message = await websocket.receive()
        if "json" in message:
            payload = message["json"]
        elif "text" in message:
            payload = json.loads(message["text"])
        else:
            await websocket.close(code=4002, reason="Unsupported message type")
            return
        user = await authenticate_user(payload["token"], payload["user_id"])
        # print(user)
        conversation_manager.set_device(payload["device"])
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        print("Volume control", user["volume_control"])
        await websocket.send_json(
            {"type": "auth_success", "text_data": user["volume_control"]}
        )
        print("Authentication successful", user)

        messages = []

        personality_translation = get_personality_translation(
            user, payload.get("personality_translation_id", None)
        )
        personality_translation_id = personality_translation[
            "personalities_translation_id"
        ]

        print("personality_translation", personality_translation)

        language_code = user["language_code"]
        voice = personality_translation["voice"]
        tts_model = voice["tts_model"]
        title = personality_translation["title"]
        subtitle = personality_translation["subtitle"]
        trait = personality_translation["trait"]

        chat_history = await get_msgs(user["user_id"], personality_translation_id)

        for chat in chat_history.data:
            messages.append(
                {
                    "role": chat["role"],
                    "content": chat["content"],
                }
            )

        user_type = user["user_info"]["user_type"]

        if user_type == "user":
            supervisee_persona = user["supervisee_persona"]
            supervisee_age = user["supervisee_age"]
            supervisee_name = user["supervisee_name"]
            content = get_user_prompt_prefix(
                language_code=language_code,
                supervisee_name=supervisee_name,
                supervisee_age=supervisee_age,
                supervisee_persona=supervisee_persona,
            )
            content += SYS_PROMPT_PREFIX[language_code]
        else:
            user_metadata = user["user_info"]["user_metadata"]
            doctor_name = user_metadata.get("doctor_name", "doctor")
            hospital_name = user_metadata.get("hospital_name", "an amazing hospital")
            specialization = user_metadata.get("specialization", "general medicine")
            favorite_phrases = user_metadata.get(
                "favorite_phrases", "you're doing an amazing job"
            )
            content = get_doctor_prompt_prefix(
                language_code=language_code,
                doctor_name=doctor_name,
                hospital_name=hospital_name,
                specialization=specialization,
                favorite_phrases=favorite_phrases,
            )

        content += get_personality_prompt_prefix(
            language_code, title=title, subtitle=subtitle, trait=trait
        )

        if tts_model == "AZURE":
            content += get_language_spoken_prompt_prefix(language_code)
        else:
            content += get_user_native_language_prompt_prefix(language_code)

        print("content foobar", content)

        messages.append(
            {
                "role": "system",
                "content": content,
            },
        )

        await conversation_manager.main(
            websocket,
            data_stream,
            user,
            personality_translation,
            messages,
        )

    except WebSocketDisconnect:
        conversation_manager.connection_open = False
    except Exception as e:
        conversation_manager.connection_open = False
        print(f"Error in websocket_endpoint: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {repr(e)}")
        print(traceback.format_exc())
    finally:
        manager.disconnect(websocket)
