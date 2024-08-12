import asyncio
import os

from app.utils.transcription_collector import TranscriptCollector
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveOptions,
    LiveTranscriptionEvents,
)
from fastapi import WebSocketDisconnect


async def get_deepgram_transcript(
    callback,
    data_stream: asyncio.Queue,
    transcription_complete: asyncio.Event,
    transcript_collector: TranscriptCollector,
):
    try:
        config = DeepgramClientOptions(options={"keepalive": "true"})
        # DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY
        # deepgram = DeepgramClient(DEEPGRAM_API_KEY, config)
        deepgram = DeepgramClient(os.getenv("DG_API_KEY"), config)
        dg_connection = deepgram.listen.asynclive.v("1")
        # print("Listening...")

        async def on_open(self, open, **kwargs):
            print(f"Connection Open...")

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript

            if len(sentence.strip()) == 0:
                return

            if result.is_final:
                transcript_collector.add_part(sentence)
                if result.speech_final:
                    utterance = transcript_collector.get_full_transcript()
                    utterance = utterance.strip()
                    print("utterance---", utterance)
                    callback(utterance)
                    transcript_collector.reset()
                    transcription_complete.set()
            #     else:
            #         await websocket.send_text(f"Is Final: {sentence}")
            # else:
            #     await websocket.send_text(f"Interim Results: {sentence}")

        async def on_utterance_end(self, utterance_end, **kwargs):
            if transcript_collector.get_length() > 0:
                # transcription_id = str(uuid.uuid4())
                utterance = transcript_collector.get_full_transcript()
                utterance = utterance.strip()
                print("utterance+++", utterance)
                callback(utterance)

                transcript_collector.reset()
                transcription_complete.set()

        dg_connection.on(LiveTranscriptionEvents.Open, on_open)
        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

        options = LiveOptions(
            model="nova-2",
            punctuate=True,
            language="en-US",
            smart_format=True,
            encoding="linear16",
            # channels=1,
            multichannel=True,
            sample_rate=24000,
            interim_results=True,
            utterance_end_ms="1500",
            vad_events=True,
            endpointing=300,
            filler_words=True,
            numerals=True,
            diarize=True,
        )

        addons = {"no_delay": "true"}

        if await dg_connection.start(options, addons=addons) is False:
            return

        try:
            while not transcription_complete.is_set():
                data = await data_stream.get()
                await dg_connection.send(data)
        except WebSocketDisconnect:
            await dg_connection.finish()

        await transcription_complete.wait()  # Wait for the transcription to complete instead of looping indefinitely

        # Indicate that we've finished
        await dg_connection.finish()

    except Exception as e:
        print(f"Could not open socket: {e}")
        return
