import asyncio
from dotenv import load_dotenv
from hume import HumeVoiceClient, MicrophoneInterface
import os

load_dotenv();

# Access the variables
hume_api_key = os.getenv('HUME_API_KEY')

async def main() -> None:
    client = HumeVoiceClient(hume_api_key)

    async with client.connect() as socket:
        await MicrophoneInterface.start(socket)

asyncio.run(main())
