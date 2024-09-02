import logging
import os
from typing import ClassVar

import torch
from dotenv import load_dotenv
from pydantic import AnyHttpUrl, ConfigDict, Field
from pydantic_settings import BaseSettings

log_format = logging.Formatter("%(asctime)s : %(levelname)s - %(message)s")

# root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# standard stream handler
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(log_format)
root_logger.addHandler(stream_handler)

logger = logging.getLogger(__name__)
load_dotenv()


silero_vad = torch.hub.load(
    repo_or_dir="snakers4/silero-vad",
    model="silero_vad",
    # force_reload=True,
    onnx=True,
)


class Settings(BaseSettings):
    # API_V1_STR: str = "/api/v1"

    # App
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv(
        "CELERY_RESULT_BACKEND", "redis://localhost:6379/0"
    )
    CELERY_BEAT_SCHEDULE: dict = {
        "print-current-time": {
            "task": "app.celery.tasks.print_current_time",
            "schedule": 10.0,  # Run every 10 seconds
            # "args": (16, 16),
        },
    }

    # LLM configuration
    LLM_MODEL_NAME: str = Field(default_factory=lambda: os.getenv("LLM_MODEL_NAME", ""))
    AZURE_OPENAI_ENDPOINT: str = Field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_ENDPOINT", "")
    )
    AZURE_OPENAI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_API_KEY", "")
    )

    # STT
    DEEPGRAM_API_KEY: str = Field(default_factory=lambda: os.getenv("DG_API_KEY", ""))

    # TTS
    MS_SPEECH_ENDPOINTY: str = Field(
        default_factory=lambda: os.getenv("MS_SPEECH_ENDPOINTY", "")
    )
    SPEECH_KEY: str = Field(default_factory=lambda: os.getenv("SPEECH_KEY", ""))
    SPEECH_REGION: str = Field(default_factory=lambda: os.getenv("SPEECH_REGION", ""))

    # Analytics
    HF_ACCESS_TOKEN: str = Field(
        default_factory=lambda: os.getenv("HF_ACCESS_TOKEN", "")
    )

    # DB
    NEXT_PUBLIC_SUPABASE_URL: str = Field(
        default_factory=lambda: os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    )
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = Field(
        default_factory=lambda: os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    )
    SERVICE_ROLE: str = Field(default_factory=lambda: os.getenv("SERVICE_ROLE", ""))
    SUPABASE_JWT_SECRET: str = Field(
        default_factory=lambda: os.getenv("SUPABASE_JWT_SECRET", "")
    )

    # Voice processing
    silero_vad_model: ClassVar = silero_vad[0]
    silero_vad_utils: ClassVar = silero_vad[1]

    # Others
    SERVER_HOST: AnyHttpUrl = "https://localhost"
    SERVER_PORT: int = 8000
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = []

    PROJECT_NAME: str = "fastapi supabase"

    Config: ClassVar[ConfigDict] = ConfigDict(arbitrary_types_allowed=True)


settings = Settings()
