import os
from venv import create

from app.core.config import settings
from app.db.supabase import create_supabase_client
from fastapi import Depends, FastAPI, HTTPException, WebSocket
from jose import JWTError, jwt

JWT_SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"


async def get_token_from_query(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=403, detail="No token provided")
    return token


async def get_user(user_id: str):
    supabase = create_supabase_client()
    response = supabase.table("users").select("*").eq("user_id", user_id).execute()
    if response.data:
        return response.data[0]
    return None


async def get_user_id(payload: dict):
    user_id = payload.get("user_id")
    return user_id


async def authenticate_user(
    token: str = Depends(get_token_from_query), user_id: str = None
):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        print(f"payload: {payload}")

        if not user_id:
            user_id = await get_user_id(payload)

        user = await get_user(user_id)
        if user is None:
            raise HTTPException(status_code=403, detail="Invalid user")
        return user
    except JWTError:
        return None


# import secrets

# jwt_secret_key = secrets.token_urlsafe(32)
# print(f"JWT_SECRET_KEY: {jwt_secret_key}")

# import datetime

# from jose import jwt

# ALGORITHM = "HS256"


# def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
#     to_encode = data.copy()

#     if expires_delta:
#         expire = datetime.datetime.utcnow() + expires_delta
#         to_encode.update({"exp": expire})

#     encoded_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm=ALGORITHM)
#     return encoded_jwt


# # Usage:
# email = "junruxiong@gmail.com"
# user_id = "0079cee9-1820-4456-90a4-e8c25372fe29"
# created_time = "2024-07-08T00:00:00.000Z"
# data = {"email": email, "user_id": user_id, "created_time": created_time}
# token = create_access_token(data=data, expires_delta=datetime.timedelta(days=1))
# print(f"AUTH_TOKEN: {token}")
