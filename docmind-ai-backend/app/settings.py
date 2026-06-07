from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind Backend"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:8080", "https://*.lovable.app", "https://docmind.app","http://13.222.21.162:3000"]
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # OpenAI / OpenRouter
    OPENAI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Chroma
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
