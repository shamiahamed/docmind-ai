from supabase import create_client
from app.settings import settings

def get_supabase():
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_JWT_SECRET
    )
