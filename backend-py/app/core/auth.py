import os

from app.core.config import settings
from fastapi import Depends, FastAPI, HTTPException, WebSocket
from fastapi.websockets import WebSocketDisconnect
from jose import JWTError, jwt

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"


async def get_token_from_query(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=403, detail="No token provided")
    return token


async def authenticate_user(token: str = Depends(get_token_from_query)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401, detail="Invalid authentication credentials"
            )
        return {"username": username}
    except JWTError:
        return None


# import secrets

# secret_key = secrets.token_urlsafe(32)
# print(f"SECRET_KEY: {secret_key}")

import datetime

from jose import jwt

ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Usage:
username = "123"  # This would typically come from your user authentication process
token = create_access_token(data={"sub": username})
print(f"AUTH_TOKEN: {token}")
