import time

from app.core.config import settings
# from app.models.text_analysis_output import TextAnalysisOutput
# from app.models.text_input import TextInput
# from app.services.llm_response import openai_response
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.db.supabase import create_supabase_client

router = APIRouter()

import datetime

from jose import jwt

# jwt_secret_key = secrets.token_urlsafe(32)
# print("jwt_secret_key", jwt_secret_key)

ALGORITHM = "HS256"


def create_access_token(jwt_secret_key: str, data: dict, expire_days: int = None):
    to_encode = data.copy()

    if expire_days:
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=expire_days)
        to_encode.update({"exp": expire.isoformat()})

    # Convert created_time to ISO format string
    if "created_time" in to_encode:
        to_encode["created_time"] = to_encode["created_time"].isoformat()

    encoded_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm=ALGORITHM)
    return encoded_jwt


@router.get("/hardware_auth")
async def hardware_auth(device_code: str, email: str, mac_address: str, expire_days: int = None):
    supabase = create_supabase_client()

    # check if user with email exists
    user_response = (
        supabase.table("users")
        .select("*")
        .eq("email", email)
        .execute()
    )
    if user_response and len(user_response.data) == 0:
        return PlainTextResponse(content="INVALID_EMAIL")
    if not user_response or not user_response.data or len(user_response.data) == 0:
        raise HTTPException(status_code=401, detail="Invalid user or email")

    device_code = device_code.lower()

    # check if device with deviceCode exists
    device_response = (
        supabase.table("devices")
        .select("*")
        .eq("user_code", device_code)
        .execute()
    )
    if device_response and len(device_response.data) == 0:
        return PlainTextResponse(content="INVALID_CODE")
    if not device_response or not device_response.data or len(device_response.data) == 0:
        raise HTTPException(status_code=401, detail="Invalid user or device code")
    
    user_id = user_response.data[0]["user_id"]
    device_id = device_response.data[0]["device_id"]

    # if both user and device exist, add device information to the device table
    supabase.table("devices").update({
        "mac_address": mac_address, 
        "user_id": user_id,
        "user_code": device_code
        }).eq("device_id", device_id).execute()
    
    jwt_secret_key = settings.JWT_SECRET_KEY

    payload = {
        "email": email,
        "user_id": user_id,
        "created_time": datetime.datetime.utcnow(),
    }

    try:
        token = create_access_token(
            jwt_secret_key=jwt_secret_key, data=payload, expire_days=expire_days
        )
        return PlainTextResponse(content=token)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
