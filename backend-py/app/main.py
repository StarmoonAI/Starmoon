import asyncio
import logging
import os
from signal import SIGINT, SIGTERM
from typing import Union

from app.api.endpoints import analyze_text, db_user, starmoon
from app.core.config import settings
from deepgram.utils import verboselogs
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

load_dotenv()
app = FastAPI()

# origins = [
#     "http://localhost.tiangolo.com",
#     "https://localhost.tiangolo.com",
#     "http://localhost",
#     "http://localhost:8080",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# print(settings.silero_vad_model)
# print(settings.silero_vad_utils)
app.include_router(analyze_text.router, prefix="/api", tags=["LLM response"])
app.include_router(db_user.router, prefix="/api", tags=["User"])
# app.include_router(tts.router, tags=["TTS WebSocket"])
app.include_router(starmoon.router, tags=["StarMoon WebSocket"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ws_ping_interval=900,
        ws_ping_timeout=900,
    )
