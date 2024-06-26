"""Async client for handling messages to and from an EVI connection."""

import base64
import json
import logging
from dataclasses import dataclass
from typing import Optional

from supabase import Client
from hume._voice.microphone.asyncio_utilities import Stream
from hume._voice.microphone.microphone_sender import Sender
from hume._voice.voice_socket import VoiceSocket
from hume.error.hume_client_exception import HumeClientException
from hume._voice.microphone.chat_client import ChatClient

logger = logging.getLogger(__name__)


@dataclass
class CustomChatClient(ChatClient):
    """Async client for handling messages to and from an EVI connection."""
  
    supabase: Client
    user: dict
    toy: dict
    chat_group_id: Optional[str] = None

    @classmethod
    def new(cls, *, supabase: Client, toy: dict, user: dict, sender: Sender) -> "CustomChatClient":
        """Create a new chat client.

        Args:
            sender (Sender): Sender for audio data.
        """
        return cls(sender=sender, supabase=supabase, toy=toy, user=user, byte_strs=Stream.new())

    async def _recv(self, *, socket: VoiceSocket) -> None:
        async for socket_message in socket:
            message = json.loads(socket_message)
            if message["type"] in ["user_message", "assistant_message"]:
                role = self._map_role(message["message"]["role"])
                message_text = message["message"]["content"]
                text = f"{role}: {message_text}"
                self.supabase.table("conversations").insert({
                    "toy_id": self.toy["toy_id"],
                    "user_id": self.user["user_id"],
                    "role": message["message"]["role"],
                    "content": message["message"]["content"],
                    "metadata": message["models"]["prosody"],
                    "chat_group_id": self.chat_group_id,
                }).execute()
            elif message["type"] == "audio_output":
                message_str: str = message["data"]
                message_bytes = base64.b64decode(message_str.encode("utf-8"))
                await self.byte_strs.put(message_bytes)
                continue
            elif message["type"] == "error":
                error_message: str = message["message"]
                error_code: str = message["code"]
                raise HumeClientException(f"Error ({error_code}): {error_message}")
            elif message["type"] == "tool_call":
                print(
                    "Warning: EVI is trying to make a tool call. "
                    "Either remove tool calling from your config or "
                    "use the VoiceSocket directly without a MicrophoneInterface."
                )
                tool_call_id = message["tool_call_id"]
                if message["response_required"]:
                    content = "Let's start over"
                    await self.sender.send_tool_response(socket=socket, tool_call_id=tool_call_id, content=content)
                continue
            elif message["type"] == "chat_metadata":
                message_type = message["type"].upper()
                chat_id = message["chat_id"]
                chat_group_id = message["chat_group_id"]
                self.chat_group_id = chat_group_id

                text = f"<{message_type}> Chat ID: {chat_id}, Chat Group ID: {chat_group_id}"
            else:
                message_type = message["type"].upper()
                text = f"<{message_type}>"

            self._print_prompt(text)
