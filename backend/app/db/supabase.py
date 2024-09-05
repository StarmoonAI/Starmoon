from app.core.config import settings

from supabase import Client, create_client


def create_supabase_client():
    supabase: Client = create_client(
        settings.NEXT_PUBLIC_SUPABASE_URL, settings.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    return supabase
