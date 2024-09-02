import os

from supabase import Client, create_client

url: str = "https://xsvxmalaeeotypbdvvmv.supabase.co"
key: str = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdnhtYWxhZWVvdHlwYmR2dm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUyNzQyNjgsImV4cCI6MjA0MDg1MDI2OH0.ujQ_j4bWIQOV1DdZMQTYi5xcr-aIF-QAUN5_wwb0Kyo"
)
supabase: Client = create_client(url, key)


def setup_database():
    # with open("schema.sql", "r") as file:
    #     sql_commands = file.read()

    # # Execute the SQL commands
    # supabase.table("users").select(
    #     "*"
    # ).execute()  # This creates the table if it doesn't exist
    # result = supabase.sql(sql_commands)
    # print("Database setup complete:", result)

    # seed the database
    with open("supabase/seed.sql", "r") as file:
        sql_commands = file.read()
    result = supabase.sql(sql_commands)
    print("Database seeded:", result)


if __name__ == "__main__":
    setup_database()
