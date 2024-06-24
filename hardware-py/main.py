import asyncio
from dotenv import load_dotenv
from hume import HumeVoiceClient, MicrophoneInterface
import os
from supabase import create_client, Client
from hume_helpers import on_open, on_message, on_error, on_close

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Access the variables
hume_api_key = os.getenv('HUME_API_KEY')
# hume_secret_key = os.getenv("HUME_SECRET_KEY")

async def main() -> None:
    client = HumeVoiceClient(hume_api_key)
    # response = supabase.table('conversations').select("*").execute()
    # print(response)

    async with client.connect_with_handlers(
            on_open=on_open,                # Handler for when the connection is opened
            on_message=on_message,          # Handler for when a message is received
            on_error=on_error,              # Handler for when an error occurs
            on_close=on_close,              # Handler for when the connection is closed
            enable_audio=True,              # Flag to enable audio playback (True by default)
    ) as socket:
        await MicrophoneInterface.start(socket)

asyncio.run(main())
