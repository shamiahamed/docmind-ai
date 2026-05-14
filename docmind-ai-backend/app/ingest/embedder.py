import chromadb
from langchain_chroma import Chroma
from app.settings import settings
from app.agents.llm import get_embeddings
from app.logger import get_logger

logger = get_logger("ingest.embedder")

def get_vector_store(user_id: str):
    collection_name = f"user_{user_id.replace('-', '_')}"
    logger.info(f"[EMBEDDER] Connecting to collection: {collection_name}")
    embeddings = get_embeddings()
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIRECTORY
    )

async def add_documents_to_store(user_id: str, chunks: list):
    logger.info(f"[EMBEDDER] Embedding {len(chunks)} chunks for user={user_id}")
    vector_store = get_vector_store(user_id)
    await vector_store.aadd_documents(chunks)
    logger.info(f"[EMBEDDER] Done | {len(chunks)} chunks stored in ChromaDB")
