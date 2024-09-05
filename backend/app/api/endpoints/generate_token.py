import time

from app.core.config import settings
from app.models.text_analysis_output import TextAnalysisOutput
from app.models.text_input import TextInput
from app.services.llm_response import openai_response
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

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


@router.post("/generate_client_token")
async def generate_client_token(email: str, user_id: str, expire_days: int = None):

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
        return JSONResponse(content={"token": token})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# # Usage:
# email = "junruxiong@gmail.com"
# user_id = "0079cee9-1820-4456-90a4-e8c25372fe29"
# created_time = datetime.datetime.utcnow()
# data = {"email": email, "user_id": user_id, "created_time": created_time}
# token = create_access_token(data=data)
# print(f"AUTH_TOKEN: {token}")
