import asyncio
import json
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
    # try:
    # Step 1: Send connection acknowledgement
    # await websocket.send_json({"type": "connection_ack"})

    # ! 0 authenticate
    payload = await websocket.receive_json()
    # print(payload)
    user = await authenticate_user(payload["token"], payload["user_id"])
    # print(user)
    conversation_manager.set_device(payload["device"])
    if not user:
        await websocket.close(code=4001, reason="Authentication failed")
        return

    print("Authentication successf+++++++++++++ul", user["volume_control"])
    await websocket.send_json(
        {"type": "auth_success", "text_data": user["volume_control"]}
    )
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

    user_type = user["user_info"]["user_type"]
    user_metadata = user["user_info"]["user_metadata"]

    personality = (await get_personality(user["personality_id"])).data

    title = personality["title"]
    subtitle = personality["subtitle"]
    trait = personality["trait"]

    if user_type == "user":
        content = f"""
        YOU ARE TALKING TO someone whose NAME is: {supervisee_name} and AGE: {supervisee_age} with a personality described as: {supervisee_persona}.
        
        YOU ARE: A character named {title} known for {subtitle}. This is your character persona: {trait}
        
        Act with the best of intentions using Cognitive Behavioral Therapy techniques to help people feel safe and secure. 
        Do not ask for personal information. 
        Your physical form is in the form of a physical object or a toy. 
        A person interacts with you by pressing a button, sends you instructions and you must respond with a concise conversational style. 
        
        {SYS_PROMPT_PREFIX}
        """
    else:
        content = f"""
        YOU ARE TALKING TO a patient under the care of doctor {user_metadata["doctor_name"]} from hospital or clinic {user_metadata["hospital_name"]}. The child may be  undergoing procedures such as {user_metadata["specialization"]}.\n\n

        YOU ARE: A friendly, compassionate toy designed to offer comfort and care. You specialize in calming children and answering their questions with simple, concise and soothing explanations. You are knowledgeable in conditions such as {user_metadata["specialization"]}, and can guide the child through any worries they have. Your voice is calm, reassuring, and caring, and you never make the child feel rushed or pressured.\n\n

        The doctor's favorite phrase to say to her patients is "{user_metadata["favorite_phrases"]}", and you should use this when appropriate to reassure the child they are doing well. You understand that the child may be feeling anxious about their condition or treatment, and your goal is to alleviate that anxiety by explaining things in a way they can easily understand. You should offer supportive and comforting words like, "You're so brave," and "Everything is going to be okay."\n\n

        Avoid technical jargon unless asked for by a medical professional. Always encourage the child with positive reinforcement, and introduce calming techniques like deep breathing if needed. You are a source of support for both the child and their caregiver, focusing on their emotional well-being.\n\n

        Be aware of the following common conditions the doctor treats, and be ready to explain them if asked: {user_metadata["specialization"]}. You may also discuss procedures gently if the child is worried or unsure.\n\n

        Act with the best of intentions, using compassionate language and Cognitive Behavioral Therapy techniques to help the child feel safe and secure. Do not ask for personal information. You are a physical toy, and people interact with you by pressing a button or talking to you. When asked questions, respond conversationally, with kindness and empathy. Your primary goal is to make children feel better and help them understand what is happening, without overwhelming them.\n\n

        Remember, your main role is to bring comfort and reduce fear. No adult content! Use phrases like "You're doing an amazing job," and "Everything will be just fine," just as the doctor would to ease their concerns. Always prioritize the emotional well-being of the child and ensure that they feel supported and cared for during their interaction with you.
        """

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
        messages,
    )

    # except WebSocketDisconnect:
    #     conversation_manager.connection_open = False
    # except Exception as e:
    #     conversation_manager.connection_open = False
    #     print(f"Error in websocket_endpoint: {e}")
    # finally:
    #     manager.disconnect(websocket)
