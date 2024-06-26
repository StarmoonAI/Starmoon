from typing import Optional
from hume import VoiceSocket
from hume._voice.session_settings import AudioSettings, SessionSettings
import logging
import json

logger = logging.getLogger(__name__)


class CustomVoiceSocket(VoiceSocket):
    """Custom voice socket."""

    async def update_session_settings(
        self,
        *,
        sample_rate: Optional[int] = None,
        num_channels: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> None:
        """Update the EVI session settings."""
        if num_channels is not None:
            self._num_channels = num_channels
        if sample_rate is not None:
            self._sample_rate = sample_rate

        session_settings = SessionSettings(
            audio=AudioSettings(
                channels=num_channels,
                sample_rate=sample_rate,
            ),
            system_prompt=system_prompt,
        )

        settings_dict = session_settings.model_dump(exclude_none=True)

        logger.info(f"Updating session settings to: {settings_dict}")
        message = json.dumps(settings_dict)
        await self._protocol.send(message)
