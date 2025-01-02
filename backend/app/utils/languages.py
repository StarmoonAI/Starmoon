from typing import Any, Dict, Optional
from app.db.supabase import create_supabase_client


def get_deepgram_language_code(language_code: str) -> str:
    language_map = {
        "en-US": "en-US",
        "de-DE": "de",
        "es-AR": "es",
        "zh-CN": "zh",
    }

    return language_map.get(language_code, "en-US")

personality_translation_query_string = "*, personality:personalities(*), voice:toys(toy_id, name, tts_language_code, tts_code, tts_model)"

def get_personality_translation_by_id(personality_translation_id: str) -> Dict[str, Any]:
    supabase = create_supabase_client()
    response = supabase.table("personalities_translations").select(personality_translation_query_string).eq("personalities_translation_id", personality_translation_id).execute()
    return response.data[0] if response.data else {}


def get_current_personality_translation(user: dict) -> Dict[str, Any]:
    supabase = create_supabase_client()
    response = supabase.table("personalities").select("key").eq("personality_id", user["personality_id"]).execute()
    personality_key = response.data[0]["key"]

    response = supabase.table("personalities_translations").select(personality_translation_query_string).eq("language_code", user["language_code"]).eq("personality_key", personality_key).execute()
    print(f"foobar response: {response}")
    return response.data[0] if response.data else {}


def get_personality_translation(user, personality_translation_id: Optional[str]) -> Dict[str, Any]:
    if not personality_translation_id:
        return get_current_personality_translation(user)
    return get_personality_translation_by_id(personality_translation_id)
