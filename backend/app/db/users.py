from app.db.supabase import create_supabase_client


def update_user(user_id: str, data: dict):
    supabase = create_supabase_client()
    try:
        response = supabase.table("users").update(data).eq("user_id", user_id).execute()
        print("response+++++", response)
    except Exception as e:
        return {"error": str(e)}
