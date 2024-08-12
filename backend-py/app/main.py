from app.api.endpoints import db_user, generat_token, starmoon
from app.core.config import settings
from dotenv import load_dotenv
from fastapi import FastAPI
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

app.include_router(db_user.router, prefix="/api", tags=["User"])
app.include_router(generat_token.router, prefix="/api", tags=["Token"])
app.include_router(starmoon.router, tags=["StarMoon WebSocket"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        debug=True,
        reload=True,
        ws_ping_interval=900,
        ws_ping_timeout=900,
    )
