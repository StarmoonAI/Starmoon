import asyncio
from dotenv import load_dotenv
from hume import HumeVoiceClient, MicrophoneInterface
import os
from supabase import create_client, Client

from custom_hume.custom_chat_client import CustomChatClient;
from hume._voice.microphone.microphone import Microphone
from hume._voice.microphone.microphone_sender import MicrophoneSender

from custom_hume.custom_hume_voice_client import CustomHumeVoiceClient
from prompt import Prompt
from supabase_helpers import get_toy_by_id, get_user_by_id

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)
default_toy_id: str = "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8";
user_id: str = "29be7658-46bb-448f-ac4e-b57d3cb0da6a";

# Access the variables
hume_api_key = os.getenv('HUME_API_KEY')

async def main() -> None:
    client = CustomHumeVoiceClient(hume_api_key)
    toy = get_toy_by_id(supabase, default_toy_id)
    user = get_user_by_id(supabase, user_id)
    prompt = Prompt.new(supabase=supabase, toy=toy, user=user, chat_group_id=None);
    prompt_text = await prompt.construct_prompt()

    async with client.connect(
           config_id=str(toy.hume_ai_config_id),
    ) as socket:
            with Microphone.context(device=Microphone.DEFAULT_DEVICE) as microphone:
                    sender = MicrophoneSender.new(microphone=microphone, allow_interrupt=True)
                    chat_client = CustomChatClient.new(sender=sender, supabase=supabase, user=user, toy=toy)
                    print("Configuring socket with microphone settings...")
                    await socket.update_session_settings(
                            sample_rate=microphone.sample_rate,
                            num_channels=microphone.num_channels,
                            system_prompt=prompt_text,
                    )
                    print("Microphone connected. Say something!")
                    await chat_client.run(socket=socket)

asyncio.run(main())
