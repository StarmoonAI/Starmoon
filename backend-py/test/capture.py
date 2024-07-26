import sounddevice as sd
import numpy as np
import wave
import sys

# Parameters
DURATION = 1  # seconds
SAMPLE_RATE = 16000  # Hz
CHANNELS = 1  # Mono

def record_audio(filename):
    print("Recording audio...")
    audio_data = sd.rec(int(DURATION * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=CHANNELS, dtype=np.int16)
    sd.wait()  # Wait until the recording is finished
    print("Recording complete.")

    # Save the audio data to a WAV file
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # Sample width in bytes
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio_data.tobytes())

    print(f"Audio saved to {filename}")

def convert_wav_to_bin(wav_file, bin_file):
    with wave.open(wav_file, 'rb') as wav:
        frames = wav.readframes(wav.getnframes())
        with open(bin_file, 'wb') as bf:
            bf.write(frames)
    print(f"Binary data saved to {bin_file}")
    return frames

def save_to_cpp(binary_data, cpp_file):
    with open(cpp_file, 'w') as f:
        f.write("// Binary audio data array (replace with your binary data)\n")
        f.write("const uint8_t audioData[] = {")
        for i, byte in enumerate(binary_data):
            if i % 16 == 0:
                f.write("\n    ")
            f.write(f"0x{byte:02x}, ")
        f.write("\n};\n")
    print(f"Binary data saved to {cpp_file}")

def save_to_hex(binary_data, hex_file):
    with open(hex_file, 'w') as f:
        for i, byte in enumerate(binary_data):
            f.write(f"{byte:02x}")
    print(f"Hex data saved to {hex_file}")

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print("Usage: python capture_and_convert_audio.py <output_wav_file> <output_bin_file> <output_cpp_file> <output_hex_file> [record]")
        sys.exit(1)

    output_wav_file = sys.argv[1]
    output_bin_file = sys.argv[2]
    output_cpp_file = sys.argv[3]
    output_hex_file = sys.argv[4]

    # Step 1 (Optional): Record audio and save to WAV file
    if len(sys.argv) == 6 and sys.argv[5] == 'record':
        record_audio(output_wav_file)

    # Step 2: Convert WAV file to binary
    binary_data = convert_wav_to_bin(output_wav_file, output_bin_file)

    # Step 3: Save binary data to C++ file
    save_to_cpp(binary_data, output_cpp_file)

    # Step 4: Save binary data to Hex file
    save_to_hex(binary_data, output_hex_file)
