"""
-*- coding: utf-8 -*-
@Organization : SupaVision
@Author       : 18317
@Date Created : 05/01/2024
@Description  :
"""

import logging
import os
from typing import ClassVar

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


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = os.getenv("SECRET_KEY")

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

    MODEL_NAME: str = Field(default_factory=lambda: os.getenv("MODEL_NAME"))

    AZURE_OPENAI_ENDPOINT: str = Field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    AZURE_OPENAI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_API_KEY")
    )
    DEEPGRAM_API_KEY: str = Field(default_factory=lambda: os.getenv("DG_API_KEY"))

    MS_SPEECH_ENDPOINTY: str = Field(
        default_factory=lambda: os.getenv("MS_SPEECH_ENDPOINTY")
    )
    SPEECH_KEY: str = Field(default_factory=lambda: os.getenv("SPEECH_KEY"))
    SPEECH_REGION: str = Field(default_factory=lambda: os.getenv("SPEECH_REGION"))

    SUPABASE_URL: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL"))
    SUPABASE_KEY: str = Field(default_factory=lambda: os.getenv("SUPABASE_KEY"))
    SERVICE_ROLE: str = Field(default=lambda: os.getenv("SERVICE_ROLE"))

    SERVER_HOST: AnyHttpUrl = "https://localhost"
    SERVER_PORT: int = 8000
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = []

    PROJECT_NAME: str = "fastapi supabase"

    Config: ClassVar[ConfigDict] = ConfigDict(arbitrary_types_allowed=True)


settings = Settings()
