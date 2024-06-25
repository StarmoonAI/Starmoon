import asyncio
from dotenv import load_dotenv
from hume import HumeVoiceClient, MicrophoneInterface
import os
from supabase import create_client, Client

from chat_client import ChatClient;
from hume._voice.microphone.microphone import Microphone
from hume._voice.microphone.microphone_sender import MicrophoneSender

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)
default_toy_id: str = "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8";
user_id: str = "29be7658-46bb-448f-ac4e-b57d3cb0da6a";

# Access the variables
hume_api_key = os.getenv('HUME_API_KEY')

async def main() -> None:
    client = HumeVoiceClient(hume_api_key)


    async with client.connect() as socket:
            with Microphone.context(device=Microphone.DEFAULT_DEVICE) as microphone:
                    sender = MicrophoneSender.new(microphone=microphone, allow_interrupt=True)
                    chat_client = ChatClient.new(sender=sender, supabase=supabase, user_id=user_id, toy_id=default_toy_id)
                    print("Configuring socket with microphone settings...")
                    await socket.update_session_settings(
                            sample_rate=microphone.sample_rate,
                            num_channels=microphone.num_channels,
                    )
                    print("Microphone connected. Say something!")
                    await chat_client.run(socket=socket)

asyncio.run(main())
