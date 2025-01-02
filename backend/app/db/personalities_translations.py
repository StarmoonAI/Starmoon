from app.db.supabase import create_supabase_client

async def get_personalities_translation(personality_translation_id: str):
    supabase = create_supabase_client()
    # get personality from database
    try:
        personalities_translation = (
            supabase.table("personalities_translations")
            .select("*, personality:personalities(*), voice:toys(*)")
            .eq("personalities_translation_id", personality_translation_id)
            .single().execute()
        )
        return personalities_translation.data
    except Exception as e:
        return {"error": str(e)}
