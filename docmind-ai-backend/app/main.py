from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.settings import settings
from app.routers import chat, documents
from app.logger import logger
from app.exceptions import register_exception_handlers

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register global exception handlers
register_exception_handlers(app)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])

@app.on_event("startup")
async def on_startup():
    logger.info("🚀 DocMind Backend started successfully")
    logger.info(f"   Supabase URL : {settings.SUPABASE_URL}")
    logger.info(f"   OpenRouter   : {'configured' if settings.OPENROUTER_API_KEY else 'NOT SET'}")
    logger.info(f"   Chroma dir   : {settings.CHROMA_PERSIST_DIRECTORY}")

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("🛑 DocMind Backend shutting down")

@app.get("/")
async def root():
    logger.info("Health check endpoint called")
    return {"status": "ok", "message": "DocMind API is running"}
