from supabase import Client, create_client
from app.core.config import settings


def create_supabase_client():
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return supabase
