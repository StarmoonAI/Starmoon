import torch

torch.set_num_threads(1)


USE_ONNX = True  # change this to True if you want to test onnx model
model, utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad",
    model="silero_vad",
    onnx=USE_ONNX,
)

(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils


wav = read_audio(
    "voice.wav",
)
speech_timestamps = get_speech_timestamps(wav, model)
print(speech_timestamps)

# print the total amount of speech frames of wav file
print(f"Detected {len(speech_timestamps)} speech frames")
