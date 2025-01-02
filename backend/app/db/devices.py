from app.db.supabase import create_supabase_client


def clear_device_data(user_id: str):
    supabase = create_supabase_client()
    try:
        response = (
            supabase.table("devices")
            .update({"mac_address": None, "user_id": None})
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as e:
        return {"error in clear_device_data": str(e)}
