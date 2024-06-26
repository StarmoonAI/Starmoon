from supabase import Client

def get_toy_by_id(supabase: Client, toy_id: str) -> dict:
    """Get a toy by its ID."""
    toy = supabase.table("toys").select("*").eq("toy_id", toy_id).execute()
    if len(toy.data) == 0:
        raise ValueError(f"Could not find toy with ID {toy_id}")
    return toy.data[0]

def get_user_by_id(supabase: Client, user_id: str) -> dict:
    """Get a user by their ID."""
    user = supabase.table("users").select("*").eq("user_id", user_id).execute()
    if len(user.data) == 0:
        raise ValueError(f"Could not find user with ID {user_id}")
    return user.data[0]