# from app.core.config import settings
from litellm import completion
from litellm import acompletion
from app.services.clients import Clients

import os

# model_name = settings.MODEL_NAME


async def openai_response(input_text: str):

    # return acompletion(
    #     model=os.getenv("MODEL_NAME"),
    #     messages=[{"role": "user", "content": "Hey, how's it going?"}],
    #     stream=True,
    # )

    client = Clients()
    return await client.aclient_azure_4o.chat.completions.create(
        model=os.getenv("MODEL_NAME"),
        temperature=0.5,
        messages=[{"role": "user", "content": input_text}],
        stream=True,
    )
