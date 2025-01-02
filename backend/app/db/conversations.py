from app.db.supabase import create_supabase_client


async def get_msgs(user_id: str, personality_translation_id: str):
    supabase = create_supabase_client()
    # get last 30 messages from database from last 10 messages
    try:
        messages = (
            supabase.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .eq("personalities_translation_id", personality_translation_id)
            .order("created_at", desc=True)
            .limit(30)
            .execute()
        )
        return messages
    except Exception as e:
        return {"error": str(e)}


def add_msg(
    personalities_translation_id: str,
    user_id: str,
    role: str,
    content: str,
    metadata: dict,
    chat_group_id: str,
    is_sensitive: bool = False,
):
    supabase = create_supabase_client()
    # add message to database
    try:
        supabase.table("conversations").insert(
            {
                "personalities_translation_id": personalities_translation_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "metadata": metadata,
                "chat_group_id": chat_group_id,  # session id
                "is_sensitive": is_sensitive,
            }
        ).execute()
        return {"message": "Message added"}
    except Exception as e:
        return {"error": str(e)}
