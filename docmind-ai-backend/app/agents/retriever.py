from app.agents.state import AgentState
from app.agents.tools import search_documents
from app.logger import get_logger

logger = get_logger("agent.retriever")

async def retriever_node(state: AgentState):
    query = state["question"]
    user_id = state["user_id"]
    logger.info(f"[RETRIEVER] Searching for: '{query}' | user={user_id}")

    chunks = await search_documents(user_id, query)

    logger.info(f"[RETRIEVER] Found {len(chunks)} chunks | scores={[round(c.score, 3) for c in chunks]}")
    return {
        "retrieved": chunks,
        "scratchpad": [{"agent": "retriever", "output": f"Found {len(chunks)} relevant chunks."}]
    }
