from typing import Union

from app.db.supabase import create_supabase_client
from app.models.text_analysis_output import TextAnalysisOutput
from app.models.text_input import TextInput
from app.services.llm_response import openai_response
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()

supabase = create_supabase_client()


# def user_exists(key: str = "email", value: str = None):
#     user = supabase.from_("users").select("*").eq(key, value).execute()
#     return len(user.data) > 0


# Retrieve a user
@router.get("/user")
async def get_user(user_id: Union[str, None] = None):
    print("Getting user", user_id)
    try:
        if user_id:
            user = supabase.table("users").select("*").eq("user_id", user_id).execute()
            if user:
                return user
            else:
                raise HTTPException(status_code=404, detail="User not found")
        else:
            users = supabase.table("users").select("user_id, email").execute()
            if users:
                return {"users": users}
            else:
                raise HTTPException(status_code=404, detail="No users found")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
