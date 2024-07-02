# import argparse
# import asyncio
# import json
# import os
# import sys

# import websockets
# from dotenv import load_dotenv

# load_dotenv()

# # Mimic sending a real-time stream by sending this many seconds of audio at a time.
# # Used for file "streaming" only.
# REALTIME_RESOLUTION = 0.250

# encoding_samplewidth_map = {"linear16": 2, "mulaw": 1}


# async def audio_stream(audio_file_path, encoding, sample_rate, channels):
#     data = open(audio_file_path, "rb").read()

#     url = "ws://localhost:8000/ws/listen"
#     # To test integrating with DG, uncomment the following line (also, specify your API key below)
#     # url = "wss://api.deepgram.com/v1/listen"

#     url += f"?encoding={encoding}&sample_rate={sample_rate}&channels={channels}"

#     async with websockets.connect(
#         url,
#         extra_headers={
#             # If you're testing integration with DG, add your API key here
#             "Authorization": "Token {}".format(os.getenv("DG_API_KEY"))
#         },
#     ) as ws:
#         print("🟢 (1/5) Successfully opened streaming connection")

#         async def sender(ws):
#             print(f"🟢 (2/5) Ready to stream data")
#             nonlocal data

#             # For audio formats with non-variable sample widths,
#             # we can do some calculations and send audio in real-time
#             sample_width = encoding_samplewidth_map.get(encoding)
#             if sample_width:
#                 # How many bytes are contained in one second of audio?
#                 byte_rate = sample_width * sample_rate * channels
#                 # How many bytes are in `REALTIME_RESOLUTION` seconds of audio?
#                 chunk_size = int(byte_rate * REALTIME_RESOLUTION)
#             # Otherwise, we'll send an arbitrary chunk size
#             else:
#                 chunk_size = 5000

#             while len(data):
#                 chunk, data = data[:chunk_size], data[chunk_size:]
#                 # Mimic real-time by waiting `REALTIME_RESOLUTION` seconds
#                 # before the next packet.
#                 await asyncio.sleep(REALTIME_RESOLUTION)
#                 # Send the data
#                 await ws.send(chunk)

#             await ws.send(json.dumps({"type": "CloseStream"}))
#             print(
#                 "🟢 (4/5) Successfully closed connection, waiting for final messages if necessary"
#             )
#             return

#         async def receiver(ws):
#             first_message = True
#             async for msg in ws:
#                 if first_message:
#                     print("🟢 (3/5) Successfully receiving server messages")
#                     first_message = False

#                 res = json.loads(msg)

#                 if res.get("msg"):
#                     print(f"Server message: {res.get('msg')}")

#                 if res.get("filename"):
#                     raw_filename = f"{res.get('filename').split('.')[0]}.raw"
#                     print(f"🟢 (5/5) Sent audio data was stored in {raw_filename}")
#                     if res.get("filename").split(".")[1] != "raw":
#                         print(
#                             f"🟢 (5/5) Sent audio data was also containerized and saved in {res.get('filename')}"
#                         )

#             return

#         functions = [
#             asyncio.ensure_future(sender(ws)),
#             asyncio.ensure_future(receiver(ws)),
#         ]
#         await asyncio.gather(*functions)


# def validate_input(input):
#     if os.path.exists(input):
#         return input

#     raise argparse.ArgumentTypeError(f"{input} is an invalid file path.")


# def validate_encoding(encoding):
#     dg_encodings = ["linear16", "flac", "mulaw", "amr-nb", "amr-wb", "opus", "speex"]
#     if encoding in dg_encodings:
#         return encoding

#     raise argparse.ArgumentTypeError(
#         f"{encoding} is not a supported encoding. For a list of supported encodings, see https://developers.deepgram.com/documentation/features/encoding/"
#     )


# def parse_args():
#     """Parses the command-line arguments."""
#     parser = argparse.ArgumentParser(
#         description="Submits data to the real-time streaming endpoint."
#     )
#     parser.add_argument(
#         "-i",
#         "--input",
#         help="The path to the raw audio file to stream. Defaults to the included file preamble.raw",
#         default="preamble.raw",
#         type=validate_input,
#     )
#     parser.add_argument(
#         "-e",
#         "--encoding",
#         choices=["linear16", "flac", "mulaw", "amr-nb", "amr-wb", "opus", "speex"],
#         help="The encoding for the raw audio file.",
#         default="linear16",
#         type=validate_encoding,
#     )
#     parser.add_argument(
#         "-s",
#         "--sample_rate",
#         help="The sample rate for the raw audio file.",
#         default=8000,
#     )
#     parser.add_argument(
#         "-c",
#         "--channels",
#         help="The number of channels in the raw audio file.",
#         default=1,
#     )
#     return parser.parse_args()


# def main():
#     # Parse the command-line arguments.
#     args = parse_args()
#     input = args.input
#     encoding = args.encoding.lower()
#     sample_rate = int(args.sample_rate)
#     channels = int(args.channels)

#     try:
#         asyncio.get_event_loop().run_until_complete(
#             audio_stream(input, encoding, sample_rate, channels)
#         )
#     except websockets.exceptions.InvalidStatusCode as e:
#         print(f"🔴 ERROR: Could not connect to server! {e}")


# if __name__ == "__main__":
#     sys.exit(main() or 0)


import asyncio
import json

import numpy as np
import sounddevice as sd
import websockets

USER_ID = "your_user_id_here"
SESSION_ID = "your_session_id_here"
API_ENDPOINT = "ws://57.151.67.244"  # wss://your-domain-name.com for https

# mic_device_id = None
# devices = sd.query_devices()
# for i, device in enumerate(devices):
#     if "mic" in device["name"].lower() or "microphone" in device["name"].lower():
#         mic_device_id = i
#         break

# if mic_device_id is None:
#     raise RuntimeError("Microphone not found. Please check your audio devices.")


async def send_audio(uri):
    async with websockets.connect(uri) as websocket:
        # Send user ID and session ID initially
        await websocket.send(json.dumps({"user_id": USER_ID, "session_id": SESSION_ID}))

        def callback(indata, frames, time, status):
            if status:
                print(status)
            asyncio.run_coroutine_threadsafe(websocket.send(indata.tobytes()), loop)

        loop = asyncio.get_event_loop()

        # num_channels = len(sd.query_devices())

        with sd.InputStream(
            samplerate=16000,
            # device=mic_device_id,
            channels=1,
            dtype=np.int16,
            callback=callback,
        ):
            try:
                while True:
                    message = await websocket.recv()
                    print(message)
                    if "Analysis Task ID" in message:
                        task_id = message.split(": ")[1]
                        asyncio.run_coroutine_threadsafe(
                            query_task_status(task_id), loop
                        )
            except websockets.exceptions.ConnectionClosed:
                print("Connection closed")


async def query_task_status(task_id):
    async with websockets.connect(f"{API_ENDPOINT}/task_status/{task_id}") as websocket:
        try:
            while True:
                result = await websocket.recv()
                print(f"Analysis Result: {result}")
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")


asyncio.run(send_audio(f"{API_ENDPOINT}/speech2text"))
