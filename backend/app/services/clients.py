import os
from typing import Union

from app.core.config import settings
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI, AsyncOpenAI, AzureOpenAI, OpenAI

load_dotenv()

class Clients:
    def __init__(self):
        self.client_azure_4o = self._create_client(sync=True)
        self.aclient_azure_4o = self._create_client(sync=False)

    def _create_client(self, sync: bool = True) -> Union[OpenAI, AzureOpenAI, AsyncOpenAI, AsyncAzureOpenAI]:
        """
        Create and return an OpenAI client based on the environment configuration.
        
        Args:
            sync (bool): If True, return a synchronous client. If False, return an asynchronous client.
        
        Returns:
            Union[OpenAI, AzureOpenAI, AsyncOpenAI, AsyncAzureOpenAI]: The appropriate OpenAI client.
        """
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_API_KEY")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

        if not api_key:
            raise ValueError("API key not found in environment variables.")

        if os.getenv("OPENAI_API_KEY"):
            return OpenAI() if sync else AsyncOpenAI()
        else:
            client_class = AzureOpenAI if sync else AsyncAzureOpenAI
            return client_class(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=azure_endpoint,
            )

    @property
    def default_client(self) -> Union[OpenAI, AzureOpenAI]:
        """
        Returns the default synchronous client.
        """
        return self.client_azure_4o

    @property
    def default_async_client(self) -> Union[AsyncOpenAI, AsyncAzureOpenAI]:
        """
        Returns the default asynchronous client.
        """
        return self.aclient_azure_4o

    def get_model_list(self) -> list:
        """
        Fetch and return a list of available models.
        """
        return self.default_client.models.list()

# Example usage
if __name__ == "__main__":
    clients = Clients()
    print(f"Default client: {type(clients.default_client)}")
    print(f"Default async client: {type(clients.default_async_client)}")
    
    try:
        models = clients.get_model_list()
        print(f"Available models: {models}")
    except Exception as e:
        print(f"Error fetching models: {e}")
