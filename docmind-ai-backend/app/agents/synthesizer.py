from app.agents.state import AgentState
from app.agents.llm import get_llm
from app.logger import get_logger
from langchain_core.messages import SystemMessage, HumanMessage
from app.models import Citation

logger = get_logger("agent.synthesizer")

async def synthesizer_node(state: AgentState):
    chunks = state.get("retrieved", [])
    logger.info(f"[SYNTHESIZER] Generating answer | {len(chunks)} chunks available")

    llm = get_llm(streaming=True)
    context = "\n\n".join([f"[{i+1}] {c.snippet}" for i, c in enumerate(chunks)])

    system_msg = SystemMessage(content=(
        "You are a helpful assistant. Use the provided context to answer the question. "
        "Cite your sources using [^n] notation where n is the index in the context. "
        "If you don't know the answer, say you don't know."
    ))
    human_msg = HumanMessage(content=f"Context:\n{context}\n\nQuestion: {state['question']}")

    response = await llm.ainvoke([system_msg, human_msg])

    # Extract citations
    citations = []
    for i, chunk in enumerate(chunks):
        if f"[^{i+1}]" in response.content:
            citations.append(Citation(
                n=i + 1,
                doc_id=chunk.doc_id,
                doc_name=chunk.doc_name,
                page=chunk.page,
                chunk_id=chunk.chunk_id
            ))

    logger.info(f"[SYNTHESIZER] Done | draft_len={len(response.content)} | citations={len(citations)}")
    return {
        "draft": response.content,
        "citations": citations
    }
