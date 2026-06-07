from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from app.settings import settings
from app.logger import get_logger

logger = get_logger("agents.llm")

def get_llm(model: str = "openrouter/auto", streaming: bool = False):
    """
    Returns a LangChain LLM instance. 
    Uses 'openrouter/auto' to let OpenRouter pick the best working model.
    """
    if settings.OPENROUTER_API_KEY:
        logger.info(f"[LLM] Using OpenRouter model selection: {model}")
        return ChatOpenAI(
            model=model,
            openai_api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            streaming=streaming,
            default_headers={
                "HTTP-Referer": "https://docmind.app",
                "X-Title": "DocMind AI"
            }
        )
    
    openai_model = "gpt-4o-mini" if model == "openrouter/auto" else model.split("/")[-1]
    logger.info(f"[LLM] Fallback to OpenAI model selection: {openai_model}")
    return ChatOpenAI(
        model=openai_model,
        openai_api_key=settings.OPENAI_API_KEY,
        streaming=streaming
    )

def get_embeddings():
    """
    Returns a LangChain Embeddings instance.
    """
    if settings.OPENROUTER_API_KEY:
        return OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            check_embedding_ctx_length=False
        )
        
    return OpenAIEmbeddings(
        model="text-embedding-3-large",
        openai_api_key=settings.OPENAI_API_KEY
    )