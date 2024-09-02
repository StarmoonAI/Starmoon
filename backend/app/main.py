import asyncio
import random
import threading
from contextlib import asynccontextmanager
from queue import Queue

import uvicorn
from app.api.endpoints import (
    analyze_text,
    db_user,
    generate_token,
    starmoon,
)
from app.core.config import settings
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

load_dotenv()


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Start MQTT thread on startup
#     mqtt_thread_instance = threading.Thread(target=mqtt_thread, daemon=True)
#     mqtt_thread_instance.start()
#     print("MQTT thread started")
#     yield


# app = FastAPI(lifespan=lifespan)
app = FastAPI()


# origins = [
#     "http://mydomain.com",
#     "https://mydomain.com",
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

app.include_router(analyze_text.router, prefix="/api", tags=["LLM response"])
app.include_router(db_user.router, prefix="/api", tags=["User"])
app.include_router(generate_token.router, prefix="/api", tags=["Token"])
app.include_router(starmoon.router, tags=["StarMoon WebSocket"])


if __name__ == "__main__":
    # # start mqtt thread
    # start FastAPI thread
    uvicorn.run(
        app,
        host="0.0.0.0",
        # host="127.0.0.1",
        port=8000,
        debug=True,
        reload=True,
        ws_ping_interval=900,
        ws_ping_timeout=900,
    )
