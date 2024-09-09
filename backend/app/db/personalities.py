from email import message

from app.db.supabase import create_supabase_client

async def get_personality(personality_id: str):
    supabase = create_supabase_client()
    # get personality from database
    try:
        personality = (
            supabase.table("personalities")
            .select("*")
            .eq("personality_id", personality_id)
            .single()
        )
        return personality
    except Exception as e:
        return {"error": str(e)}
