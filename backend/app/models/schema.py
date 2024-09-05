import datetime
import uuid

from pydantic import BaseModel


class Users(BaseModel):
    user_id: uuid
    created_at: datetime.datetime
    supervisor_name: str
    supervisee_name: str
    supervisee_persona: str
    supervisee_age: int
    toy_name: str
    toy_id: uuid
    email: str
    modules: str
    most_recent_chat_group_id: uuid
    session_time: int
    avatar_url: str


class Conversations(BaseModel):
    conversation_id: str
    toy_id: str
    user_id: str
    role: str
    content: str
    metadata: dict
    chat_group_id: str
