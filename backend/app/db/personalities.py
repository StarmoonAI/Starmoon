from app.db.supabase import create_supabase_client

async def get_personality(personality_id: str):
    supabase = create_supabase_client()
    # get personality from database
    try:
        personality = (
            supabase.table("personalities")
            .select("*, voice:toys(toy_id, name, image_src)")
            .eq("personality_id", personality_id)
            .single().execute()
        )
        return personality.data
    except Exception as e:
        return {"error": str(e)}
