import os

from app.core.config import settings
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI, AsyncOpenAI, AzureOpenAI, OpenAI

load_dotenv()


class Clients:
    def __init__(self):

        self.client_azure_4o = self._create_azure_client()
        self.aclient_azure_4o = self._create_azure_aclient()

    def _create_azure_client(self):
        # if os.getenv(OPENAI_API_KEY) has a value, use it
        if os.getenv("OPENAI_API_KEY"):
            return OpenAI()
        else:
            return AzureOpenAI(
                api_key=os.getenv("AZURE_OPENAI_API_KEY"),
                api_version="2024-02-01",
                azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            )

    def _create_azure_aclient(self):
        # if os.getenv(OPENAI_API_KEY) exists, use it
        if os.getenv("OPENAI_API_KEY"):
            return AsyncOpenAI()
        else:
            return AsyncAzureOpenAI(
                api_key=os.getenv("AZURE_OPENAI_API_KEY"),
                api_version="2024-02-01",
                azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            )
