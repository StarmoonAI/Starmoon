"""Empathic Voice Interface client."""

from hume import HumeVoiceClient, MicrophoneInterface
from custom_hume.custom_chat_mixin import CustomChatMixin

class CustomHumeVoiceClient(HumeVoiceClient, CustomChatMixin):
    """Custom Empathic Voice Interface client."""
