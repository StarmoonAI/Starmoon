import asyncio
import base64
import json
import os
import re
import traceback

import azure.cognitiveservices.speech as speechsdk
import emoji
from app.celery.tasks import emotion_detection
from app.core.config import settings
from azure.cognitiveservices.speech import SpeechConfig
from celery.result import AsyncResult
from dotenv import load_dotenv
from fastapi import WebSocket
from litellm import completion

load_dotenv()


SPEECH_KEY = settings.SPEECH_KEY
SPEECH_REGION = settings.SPEECH_REGION
speech_config = SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)

os.getenv("GEMINI_API_KEY", "")


def create_emotion_detection_task(
    utterance: str,
    user: dict,
    role: str,
    session_id: str,
    is_sensitive: bool = False,
):
    # send utterance to celery task
    celery_task = emotion_detection.delay(
        utterance, user, role, session_id, is_sensitive
    )
    task_id = celery_task.id

    return task_id


async def check_task_result(task_id: str, websocket: WebSocket):
    celery_task = AsyncResult(task_id)

    while not celery_task.ready():
        await asyncio.sleep(0.5)  # Wait for 1 second before checking again

    result = celery_task.result

    if isinstance(result, Exception):
        result = {
            "error": str(result),
            "traceback": traceback.format_exception_only(type(result), result),
        }

    await websocket.send_json(
        json.dumps(
            {
                "type": "task",
                "audio_data": None,
                "text_data": result,
                "boundary": None,
                "task_id": task_id,
            }
        )
    )


def azure_voice_systhesizer(
    text: str,
    language: str = "en-US",
    voice_name: str = "en-US-AvaMultilingualNeural",
    emotion: str = "",
    emotion_degree: float = 0,  # default
    emotion_role: str = None,
    rate: float = 0,
    pitch: float = 0,
):
    # https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice

    ssml = f"""<speak version='1.0' xml:lang="{language}" xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
    <voice name="{voice_name}">
        <mstts:express-as style="{emotion}" styledegree="{emotion_degree}">
            <prosody rate="{rate}%" pitch="{pitch}%">
                {text}
            </prosody>
        </mstts:express-as>
    </voice>
    </speak>"""

    return ssml


def azure_speech_response(ssml: str):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.speak_ssml_async(ssml).get()
    # send response back to the client
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        # await websocket.send_bytes(result.audio_data)
        return result

    return None


async def azure_send_response_and_speech(
    sentence: str, boundary: str, websocket: WebSocket, task_id: str, device: str
):
    print("sentence+++", sentence)
    # combined_sentences = (
    #     f"{previous_sentence}\n\n{sentence}" if previous_sentence else sentence
    # )
    # emotion = get_emotion(combined_sentences.strip())
    text_tone = azure_voice_systhesizer(
        text=sentence.strip(),
        voice_name="en-US-AvaMultilingualNeural",
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )
    # print finished time

    result = azure_speech_response(text_tone)

    # Send the JSON object over the WebSocket connection
    if device == "web":
        # Encode the audio data to base64
        audio_data_base64 = base64.b64encode(result.audio_data).decode("utf-8")

        # Create a JSON object with the encoded data
        json_data = json.dumps(
            {
                "type": "response",  # Specify the type of message
                "audio_data": audio_data_base64,
                "text_data": sentence,
                "boundary": boundary,  # Use the boundary parameter instead of sentence
                "task_id": task_id,
            }
        )
        await websocket.send_json(json_data)
    else:
        await websocket.send_text(json.dumps({"type": "start_of_audio"}))
        # Send audio data in chunks
        chunk_size = 1024  # Adjust this value based on your needs
        audio_data = result.audio_data
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i : i + chunk_size]
            await websocket.send_bytes(chunk)

        # Send an end-of-audio marker
        await websocket.send_text(json.dumps({"type": "end_of_audio"}))


async def speech_stream_response(
    previous_sentence: str,
    utterance: str,
    websocket: WebSocket,
    messages: list,
    user: dict,
    session_id: str,
    device: str,
):
    try:
        messages.append({"role": "user", "content": utterance})
        # print(messages)
        response = completion(
            model="gemini/gemini-1.5-pro",
            temperature=0.5,
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
            asyncio.create_task(check_task_result(task_id_input, websocket))

        accumulated_text = []
        response_text = ""
        is_first_chunk = True
        previous_sentence = utterance

        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                chunk_text = emoji.replace_emoji(
                    chunk.choices[0].delta.content, replace=""
                )
                # print("CONTENT:", chunk_text)
                accumulated_text.append(chunk_text)
                response_text += chunk_text
                sentences = re.split(r"(?<=[.。!?])\s+", "".join(accumulated_text))
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
                            sentence, boundary, websocket, task_id, device
                        )
                        await asyncio.sleep(0)
                        if device == "web":
                            asyncio.create_task(check_task_result(task_id, websocket))
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
                accumulated_text_, "end", websocket, task_id, device
            )
            await asyncio.sleep(0)
            if device == "web":
                asyncio.create_task(check_task_result(task_id, websocket))
            previous_sentence = accumulated_text

        # for chunk in response:
        #     # print("chunk+++", chunk)
        #     if chunk.choices and chunk.choices[0].delta.content:
        #         chunk_text = emoji.replace_emoji(chunk.choices[0].delta.content, replace="")

        #         accumulated_text.append(chunk_text)
        #         response_text += chunk_text
        #         sentences = re.split(r"(?<=[.。!?])\s+", "".join(accumulated_text))

        #         # send the first sentence to the client
        #         if len(sentences) > 1:
        #             for sentence in sentences[:-1]:
        #                 boundary = "start" if is_first_chunk else "mid"
        #                 task_id = create_emotion_detection_task(
        #                     f"{previous_sentence}\n\n{sentence}",
        #                     user,
        #                     "assistant",
        #                     session_id,
        #                 )
        #                 await azure_send_response_and_speech(
        #                     sentence, boundary, websocket, task_id, device
        #                 )
        #                 await asyncio.sleep(0)
        #                 if device == "web":
        #                     asyncio.create_task(check_task_result(task_id, websocket))
        #                 previous_sentence = sentence

        #             accumulated_text = [sentences[-1]]

        #     if is_first_chunk:
        #         print("This is the first chunk")
        #         is_first_chunk = False

        #     # Check if this is the last chunk
        #     if chunk.choices and chunk.choices[0].finish_reason is not None:
        #         print("This is the last chunk")
        #         # Process any remaining text
        #         print("accumulated_text+++", accumulated_text)
        #         if accumulated_text:
        #             accumulated_text_ = "".join(accumulated_text)
        #             task_id = create_emotion_detection_task(
        #                 f"{previous_sentence}\n\n{accumulated_text_}",
        #                 user,
        #                 "assistant",
        #                 session_id,
        #             )
        #             await azure_send_response_and_speech(
        #                 accumulated_text_, "end", websocket, task_id, device
        #             )
        #             await asyncio.sleep(0)
        #             if device == "web":
        #                 asyncio.create_task(check_task_result(task_id, websocket))
        #             previous_sentence = accumulated_text
        #         break

        messages.append({"role": "assistant", "content": response_text})

        return previous_sentence

    except Exception as e:
        print(f"Error in speech_stream_response: {e}")

        task_id = create_emotion_detection_task(
            utterance,
            user,
            "assistant",
            session_id,
            True,
        )
        if device == "web":
            asyncio.create_task(check_task_result(task_id, websocket))

        error_message = "Oops, it looks like we encountered some sensitive content, how about we talk about other topics?"
        task_id = create_emotion_detection_task(
            error_message,
            user,
            "assistant",
            session_id,
            True,
        )
        await azure_send_response_and_speech(
            error_message, "end", websocket, task_id, device
        )
        await asyncio.sleep(0)
        asyncio.create_task(check_task_result(task_id, websocket))

        # TODO don't add this message to the messages list
        messages.pop()

        return None
