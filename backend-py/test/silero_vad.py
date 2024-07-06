SAMPLING_RATE = 16000

import torch

torch.set_num_threads(1)

USE_ONNX = False  # change this to True if you want to test onnx model
model, utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad", model="silero_vad", force_reload=True, onnx=True
)

(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils


wav = read_audio(
    "/Users/joeyxiong/Desktop/parakeet/code/parakeetai/backend-py/test/audio/audio.wav",
)
speech_timestamps = get_speech_timestamps(wav, model)
print(speech_timestamps)

# print the total amount of speech frames of wav file
print(f"Detected {len(speech_timestamps)} speech frames")
