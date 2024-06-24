import sounddevice as sd

# UI Helper Functions
def print_ascii_art(msg: str):
    # Print ASCII art of 'EVI' and app purpose statement
    print("=" * 60)
    print(
        rf"""
                    ███████ ██    ██ ██ 
                    ██      ██    ██ ██ 
                    █████   ██    ██ ██ 
                    ██       ██  ██  ██ 
                    ███████   ████   ██         

{msg}
          """
    )
    print("=" * 60)


def list_capture_devices():
    # Log available capture audio devices (devices with input channels) and their indices
    print("-" * 60)
    print("Available CAPTURE (input) devices:")
    devices = sd.query_devices()
    for idx, device in enumerate(devices):
        if device['max_input_channels'] > 0:
            print(f"{idx}: {device['name']}")
    print("-" * 60)

def list_audio_devices():
    # Log available input and output audio devices
    print("-" * 60)
    print("ALL available audio devices:")
    print(sd.query_devices())
    print("-" * 60)