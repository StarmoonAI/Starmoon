from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, EmailStr, HttpUrl

LanguageCodeType = Literal["en-US", "de-DE", "es-ES", "es-AR", "zh-CN"]


class Voice(BaseModel):
    name: str
    toy_id: str
    image_src: str


class Personality(BaseModel):
    emoji: Optional[str]
    title: str
    trait: str
    voice: Voice
    subtitle: str
    voice_id: str
    is_doctor: bool
    created_at: str
    personality_id: str
    trait_short_description: str


class UserInfo(BaseModel):
    user_type: str
    user_metadata: Dict[str, Any]


class User(BaseModel):
    user_id: str
    avatar_url: str
    is_premium: bool
    supervisor_name: str
    email: str
    supervisee_name: str
    supervisee_persona: str
    supervisee_age: int
    volume_control: int
    personality_id: str
    personality: Optional[Personality]
    modules: Optional[Any]
    most_recent_chat_group_id: Optional[str]
    session_time: int
    user_info: UserInfo
    language_code: LanguageCodeType
