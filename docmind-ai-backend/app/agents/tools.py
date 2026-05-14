import chromadb
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from app.settings import settings
from app.models import ChunkRef
from app.ingest.embedder import get_vector_store
import sys
import io

async def search_documents(user_id: str, query: str, k: int = 5):
    vector_store = get_vector_store(user_id)
    results = await vector_store.asimilarity_search_with_relevance_scores(query, k=k)
    
    chunks = []
    for doc, score in results:
        chunks.append(ChunkRef(
            doc_id=doc.metadata.get("doc_id"),
            doc_name=doc.metadata.get("doc_name"),
            page=doc.metadata.get("page"),
            chunk_id=doc.metadata.get("chunk_id"),
            score=score,
            snippet=doc.page_content
        ))
    return chunks

def python_exec(code: str):
    """Runs Python code in a restricted environment."""
    output = io.StringIO()
    # Basic sandbox
    safe_globals = {"__builtins__": {k: __builtins__[k] for k in ["len", "sum", "max", "min", "abs", "round", "int", "float", "str", "list", "dict"]}}
    try:
        sys.stdout = output
        exec(code, safe_globals)
        return output.getvalue().strip()
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        sys.stdout = sys.__stdout__
