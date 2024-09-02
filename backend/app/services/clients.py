import os

from app.core.config import settings
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI, AsyncOpenAI, AzureOpenAI, OpenAI

load_dotenv()


class Clients:
    def __init__(self):

        self.client_azure_35 = self._create_azure_client(
            "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"
        )

        self.client_azure_4o = self._create_azure_client(
            "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"
        )
        self.aclient_azure_35 = self._create_azure_aclient(
            "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"
        )
        self.aclient_azure_4o = self._create_azure_aclient(
            "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"
        )

    def _create_azure_client(self, endpoint_env_var, azure_openai_api_key):
        return AzureOpenAI(
            **self._get_azure_config(endpoint_env_var, azure_openai_api_key)
        )

    def _create_azure_aclient(self, endpoint_env_var, azure_openai_api_key):
        return AsyncAzureOpenAI(
            **self._get_azure_config(endpoint_env_var, azure_openai_api_key)
        )

    def _get_azure_config(self, endpoint_env_var, azure_openai_api_key):
        return {
            "azure_endpoint": os.getenv(endpoint_env_var),
            "api_key": os.getenv(azure_openai_api_key),
            "api_version": "2024-02-01",
        }
