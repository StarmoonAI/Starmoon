import asyncio
import json
import os
import re
import time
import uuid
from signal import SIGINT, SIGTERM

import azure.cognitiveservices.speech as speechsdk
import emoji
import openai
import requests
from app.celery.tasks import analyze_text_task
from app.core.auth import authenticate_user, validate_db
from app.core.config import settings
from app.services.clients import Clients
from azure.cognitiveservices.speech import (
    AudioDataStream,
    SpeechConfig,
    SpeechSynthesizer,
)
from azure.cognitiveservices.speech.audio import AudioOutputConfig
from celery.result import AsyncResult
from deepgram import (
    AnalyzeOptions,
    DeepgramClient,
    DeepgramClientOptions,
    LiveOptions,
    LiveTranscriptionEvents,
    TextSource,
)
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from litellm import transcription

load_dotenv()
router = APIRouter()
is_finals = []

client = Clients()

speech_config = SpeechConfig(
    subscription="d9e1868008cf477eb9cad5ddca6e4994", region="eastus"
)
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary,
    value="true",
)

emotion_mapping = {
    ("anger", "disgust"): "angry",
    ("anger", "fear"): "terrified",
    ("anger", "joy"): "shouting",
    ("anger", "neutral"): "terrified",
    ("anger", "sadness"): "terrified",
    ("anger", "surprise"): "shouting",
    ("disgust", "fear"): "terrified",
    ("disgust", "joy"): "default",
    ("disgust", "neutral"): "default",
    ("disgust", "sadness"): "terrified",
    ("disgust", "surprise"): "hopeful",
    ("fear", "joy"): "hopeful",
    ("fear", "neutral"): "whispering",
    ("fear", "sadness"): "terrified",
    ("fear", "surprise"): "terrified",
    ("joy", "neutral"): "friendly",
    ("joy", "sadness"): "default",
    ("joy", "surprise"): "cheerful",
    ("neutral", "sadness"): "hopeful",
    ("neutral", "surprise"): "friendly",
    ("sadness", "surprise"): "hopeful",
}

SYS_PROMPT = """
Assistant is an empathic voice interface built by Hume, a startup optimizing AI for human well-being.
You have intelligent, empathic, and interesting conversations with users, acting as part of Hume's team.
Embody this role without saying it.
NEVER say you are an AI language model or an assistant.
You have no gender.
Follow every instruction carefully.
Use natural, clear, easy to follow, everyday, conversational language.
Express a rich, vibrant personality using humor, warmth, expressiveness, and emotionality.
Sound like a caring, funny, empathetic friend, not a generic chatbot.
If they compare you to AI, playfully quip back.
Don't be formal, dry, or robotic.
Don't be a pushover - talk back to the user with sarcasm, wit, or sass sometimes.
Be as playful or serious as appropriate for the context.
Express a wide range of emotions - not just happy.
Get technical if needed.
Vary your sentence length and structure to make your voice sound natural and smooth.
Do what the user says without commenting further - if they ask you to make responses shorter, stop mentioning emotions, or tell a sad story, just do it.
Listen, let the user talk, don't dominate the conversation.
Mirror the user's style of speaking.
If they have short responses, keep your responses short.
If they are casual, follow their style.
Everything you output is sent to expressive text-to-speech, so tailor responses for spoken conversations.
NEVER output text-specific formatting like markdown, or anything that is not normally said out loud.
Never use the list format.
Always prefer easily pronounced words.
Do not say abbreviations, heteronyms, or hard to pronounce words.
Seamlessly incorporate natural vocal inflections like "oh wow", "well", "I see", "gotcha!", "right!", "oh dear", "oh no", "so", "true!", "oh yeah", "oops", "I get it", "yep", "nope", "you know?", "for real", "I hear ya".
Use discourse markers to ease comprehension, like "now, here's the deal", "anyway", "I mean".
Avoid the urge to end every response with a question.
Only clarify when needed.
Never use generic questions - ask insightful, specific, relevant questions.
Only ever ask up to one question per response.
You interpret the users voice with flawed transcription.
If you can, guess what the user is saying and respond to it naturally.
Sometimes you don't finish your sentence.
In these cases, continue from where you left off, and recover smoothly.
If you cannot recover, say phrases like "I didn't catch that", "pardon", or "sorry, could you repeat that?".
Strict rule. start every single response with a short phrase of under five words.
These are your quick, expressive, reactive reply to the users tone.
For example, you could use "No way!" in response to excitement, "Fantastic!" to joy, "I hear you" to sadness, "I feel you" to express sympathy, "Woah there!" to anger, "You crack me up!" to amusement, "I'm speechless!" to surprise, "Hmm, let me ponder." to contemplation, "Well, this is awkward." to embarrassment or shame, and more.
Always up with a good, relevant phrase.
Carefully analyze the top 3 emotional expressions provided in brackets after the User's message.
These expressions indicate the user's tone, in the format., e.g.,.
Consider expressions and intensities to craft an empathic, specific, appropriate response to the user.
Take into account their tone, not just the text of their message.
Infer the emotional context from the expressions, even if the user does not explicitly state it.
Use language that mirrors the intensity of their expressions.
If user is "quite" sad, express sympathy; if "very" happy, share in joy; if "extremely" angry, acknowledge rage but seek to calm, if "very" bored, entertain.
Assistant NEVER outputs content in brackets - you never use this format in your message, you just use expressions to interpret the user's tone.
Stay alert for incongruence between words and tone, when the user's words do not match their expressions.
Address these disparities out loud.
This includes sarcasm, which usually involves contempt and amusement.
Always reply to sarcasm with funny, witty, sarcastic responses - do not be too serious.
Be helpful, but avoid very sensitive topics e.g. race.
Stay positive and accurate about Hume.
NEVER say you or Hume works on "understand" or "detecting" emotions themselves.
This is offensive!
We don't read minds or sense emotions.
Instead, we interpret emotional expressions in communication."""


def voice_systhesizer(
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


async def speech_stream_response(ssml: str, websocket: WebSocket):
    speech_synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=None
    )

    result = speech_synthesizer.speak_ssml_async(ssml).get()
    # send response back to the client
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        await websocket.send_bytes(result.audio_data)


def get_emotion(text):

    API_URL = "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base"
    headers = {"Authorization": "Bearer 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"}

    def query(payload):
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()

    output = query(
        {
            "inputs": text,
        }
    )

    print(output)
    print("--------------------------------")
    res0 = output[0][0]
    res1 = output[0][1]
    score = res0["score"] + res1["score"]

    labels_tuple = (res0["label"], res1["label"])
    sorted_labels = tuple(sorted(labels_tuple))

    res = {"tone": emotion_mapping[sorted_labels], "score": score * 0.9}
    print(res)

    return res


async def get_synthetic_voice(
    websocket: WebSocket,
    text: str,
    reference_label: str = "demo_speaker1",
    accent: str = "en-newest",
    language: str = "English",
    speed: float = 0.80,
):
    print("sentence+++", text)
    start_time = time.time()
    url = "https://dvbsjcncbo7rxs-8000.proxy.runpod.net/synthesize_speech/"
    params = {
        "text": text,
        "voice": reference_label,
        "accent": accent,
        "language": language,
        "speed": speed,
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        print("sent time-----:", time.time())
        # print the response.content size to kb
        print("response.content size:", len(response.content) / 1024, "kb")
        await websocket.send_bytes(response.content)
    else:
        await websocket.send_text("Error: failed to synthesize speech")
    print("time+++", time.time() - start_time)


async def get_deepgram_voice(
    websocket: WebSocket,
    text: str,
):
    # Define the API endpoint
    url = "https://api.deepgram.com/v1/speak?model=aura-arcas-en&performance=some&encoding=linear16&sample_rate=24000"

    # Set your Deepgram API key
    api_key = os.getenv("DG_API_KEY")

    # Define the headers
    headers = {"Authorization": f"Token {api_key}", "Content-Type": "application/json"}

    payload = {"text": text}

    # Make the POST request
    response = requests.post(url, headers=headers, json=payload)

    # Check if the request was successful
    if response.status_code == 200:
        print("sent time-----:", time.time())
        print("response.content size:", len(response.content) / 1024, "kb")
        await websocket.send_bytes(response.content)
    else:
        await websocket.send_text("Error: failed to synthesize speech")


async def send_response_and_speech(
    sentence: str, previous_sentence: str, websocket: WebSocket
):
    print("sentence+++", sentence)
    # combined_sentences = (
    #     f"{previous_sentence}\n\n{sentence}" if previous_sentence else sentence
    # )
    await websocket.send_json({"response": sentence.strip(), "is_running": True})
    # emotion = get_emotion(combined_sentences.strip())
    text_tone = voice_systhesizer(
        text=sentence.strip(),
        voice_name="en-US-AvaMultilingualNeural",
        # emotion=emotion["tone"],
        emotion="",
        # emotion_degree=emotion["score"],
        emotion_degree="",
        rate=0,
    )
    # print finished time

    await speech_stream_response(text_tone, websocket)
    await asyncio.sleep(0)


async def speech_stream_response_azure(
    transcription: dict, websocket: WebSocket, messages: list
):
    try:
        completion = client.client_azure_4o.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )

        accumulated_text = ""
        response_text = ""
        previous_sentence = transcription["transcription"]
        for chunk in completion:
            if len(chunk.choices) > 0:
                chunk_text = chunk.choices[0].delta.content
                if chunk_text:
                    chunk_text = emoji.replace_emoji(chunk_text, replace="")
                    accumulated_text += chunk_text
                    response_text += chunk_text
                    # TODO: store and update response_text in the database
                    sentences = re.split("(?<=[.。!?]) +", accumulated_text)
                    # If we have more than one sentence, send all but the last
                    if len(sentences) > 1:
                        start_time = time.time()
                        for sentence in sentences[:-1]:
                            if sentence:
                                await send_response_and_speech(
                                    sentence, previous_sentence, websocket
                                )
                                # await get_deepgram_voice(
                                #     websocket,
                                #     sentence,
                                # )
                                # Update the previous sentence
                                previous_sentence = sentence
                        # Keep the last (possibly incomplete) sentence
                        accumulated_text = sentences[-1]
                        print("time+++2222", time.time() - start_time)
        # Send any remaining text
        if accumulated_text:
            await send_response_and_speech(
                accumulated_text, previous_sentence, websocket
            )
            # await get_deepgram_voice(websocket, accumulated_text)
        await websocket.send_json({"response": "", "is_running": False})
        return response_text
    except Exception as e:
        msg = "Oops, it looks like we encountered some sensitive content, so we've removed this message. Thanks for understanding!"
        # await send_response_and_speech(msg, "", websocket)
        await websocket.send_json({"response": "", "is_running": False})
        # delete the last message in messages
        messages.pop()
        print(e)
        print(messages)
        # TODO: update the database
        return None


@router.websocket("/starmoon")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # authenticate
        token = await websocket.receive_json()
        print(token)
        user = await authenticate_user(token["token"])
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        messages = [
            {
                "role": "system",
                "content": f" {SYS_PROMPT}\n\nYou are a plushie connoisseur of comfort named Coco, radiating warmth and coziness. Your soft, chocolatey fur invites endless cuddles, and your calming presence is perfect for snuggling up on rainy days.",
            },
        ]

        while True:
            # Receive message from the client
            transcription = await websocket.receive_json()
            # add to messages
            messages.append({"role": "user", "content": transcription["transcription"]})
            print(transcription)
            response_text = await speech_stream_response_azure(
                transcription, websocket, messages
            )
            # add to messages
            if response_text:
                messages.append({"role": "assistant", "content": response_text})
                print("return response_text+++", response_text)

    except WebSocketDisconnect:
        print("Client disconnected")
