"""Empathic Voice Interface client."""

from custom_hume.custom_chat_mixin import CustomChatMixin
from hume._voice.mixins.chats_mixin import ChatsMixin
from hume._voice.mixins.configs_mixin import ConfigsMixin
from hume._voice.mixins.tools_mixin import ToolsMixin


class CustomHumeVoiceClient(CustomChatMixin, ChatsMixin, ConfigsMixin, ToolsMixin):
    """Custom Empathic Voice Interface client."""
