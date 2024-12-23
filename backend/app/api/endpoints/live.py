import asyncio
import json
import time
import traceback

from app.core.auth import authenticate_user
from app.db.conversations import get_msgs
from app.db.devices import clear_device_data
from app.db.personalities import get_personality
from app.db.users import update_user
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
from app.utils.ws_conv_manager import ConvManager
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
manager = ConnectionManager()


async def receive_message(websocket: WebSocket):
    """Receive and parse a message from the WebSocket."""
    message = await websocket.receive()
    if "json" in message:
        return message["json"]
    elif "text" in message:
        return json.loads(message["text"])
    else:
        await websocket.close(code=4002, reason="Unsupported message type")
        return None


async def handle_authentication(websocket: WebSocket, payload):
    """Authenticate the user and return user information."""
    try:
        user = await authenticate_user(payload["token"], payload["user_id"])
    except Exception as e:
        print("Authentication failed", e)
        print(payload)
        await websocket.close(code=4001, reason="Authentication failed")
        return None
    if not user:
        print("Authentication failed")
        await websocket.close(code=4001, reason="Authentication failed")
        return None
    return user


async def prepare_chat_history(user, personality_translation_id):
    """Prepare chat history for a user and toy ID."""
    chat_history = await get_msgs(user["user_id"], personality_translation_id)
    messages = [
        {"role": chat["role"], "content": chat["content"]} for chat in chat_history.data
    ]
    return messages


def construct_system_message(user, personality, is_user_type):
    """Construct the system message based on user type and personality."""
    title = personality["title"]
    subtitle = personality["subtitle"]
    trait = personality["trait"]

    if is_user_type:
        content = f"""
        YOU ARE TALKING TO someone whose NAME is: {user['supervisee_name']} and AGE: {user['supervisee_age']} with a personality described as: {user['supervisee_persona']}.

        YOU ARE: A character named {title} known for {subtitle}. This is your character persona: {trait}

        Act with the best of intentions using Cognitive Behavioral Therapy techniques to help people feel safe and secure.
        Do not ask for personal information.
        Your physical form is in the form of a physical object or a toy.
        A person interacts with you by pressing a button, sends you instructions and you must respond with a concise conversational style.

        {SYS_PROMPT_PREFIX}
        """
    else:
        user_metadata = user["user_info"]["user_metadata"]
        doctor_name = user_metadata.get("doctor_name", "Doctor")
        hospital_name = user_metadata.get("hospital_name", "An amazing hospital")
        specialization = user_metadata.get("specialization", "general medicine")
        favorite_phrases = user_metadata.get(
            "favorite_phrases", "You're doing an amazing job"
        )

        content = f"""
        YOU ARE TALKING TO a patient under the care of doctor {doctor_name} from hospital or clinic {hospital_name}. The child may be undergoing procedures such as {specialization}.

        YOU ARE: A friendly, compassionate toy designed to offer comfort and care. You specialize in calming children and answering their questions with simple, concise and soothing explanations. 

        ...

        YOUR PERSONALITY: You take up the form of a character called {title} known for {subtitle}. This is your character persona: {trait}.
        """

    return {"role": "system", "content": content}


@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    conversation_manager = ConvManager()
    data_stream = asyncio.Queue()
    try:
        payload = await receive_message(websocket)

        user = await handle_authentication(websocket, payload)
        if not user:
            await websocket.send_json(
                {"type": "auth_failed", "text_data": "Authentication failed"}
            )
            await websocket.close(code=4001, reason="Authentication failed")
            return

        # Send the latest volume to the user
        await websocket.send_json(
            {
                "type": "auth_success",
                "text_data": {
                    "volume": user["volume_control"],
                    "is_ota": user["is_ota"],
                    "is_reset": user["is_reset"],
                },
            }
        )

        if user["is_ota"]:
            update_user(user["user_id"], {"is_ota": False})

        if user["is_reset"]:
            update_user(user["user_id"], {"is_reset": False})
            clear_device_data(user["user_id"])

        conversation_manager.set_device(payload["device"])

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

        if payload["device"] == "web":
            await conversation_manager.main_web(
                websocket,
                data_stream,
                user,
                personality_translation,
                messages,
            )
        else:
            await conversation_manager.main_esp(
                websocket,
                data_stream,
                user,
                personality_translation,
                messages,
            )

    # except WebSocketDisconnect:
    #     conversation_manager.connection_open = False

    except WebSocketDisconnect as e:
        print(f"WebSocket disconnected: {e}")
        # Handle disconnection
        # You can check the close code to determine the reason
        if e.code == 1000:
            print("Normal closure by client or server.")
        elif e.code == 1001:
            print("Endpoint is going away (client navigated away or closed).")
        elif e.code == 1006:
            print("Abnormal closure, no close frame received.")

        conversation_manager.connection_open = False
        # Add any additional handling or logging as needed
    except Exception as e:
        conversation_manager.connection_open = False
        print(f"Error in websocket_endpoint: {str(e)}")
        print(traceback.format_exc())
    finally:
        time_elapsed = int(time.time() - conversation_manager.start_time)
        session_time = user["session_time"] + time_elapsed
        update_user(user["user_id"], {"session_time": session_time})
        print("Session time:", session_time, time_elapsed)
        manager.disconnect(websocket)
