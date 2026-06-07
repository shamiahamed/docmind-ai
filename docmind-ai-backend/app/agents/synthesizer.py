from app.agents.state import AgentState
from app.agents.llm import get_llm
from app.logger import get_logger
from langchain_core.messages import SystemMessage, HumanMessage
from app.models import Citation
import re

logger = get_logger("agent.synthesizer")

async def synthesizer_node(state: AgentState):
    chunks = state.get("retrieved", [])
    logger.info(f"[SYNTHESIZER] Generating answer | {len(chunks)} chunks available")

    llm = get_llm(streaming=True)
    context = "\n\n".join([f"[{i+1}] {c.snippet}" for i, c in enumerate(chunks)])

    system_msg = SystemMessage(content=(
        "You are a helpful assistant. Use the provided context to answer the question. "
        "Cite your sources by placing [1], [2], etc. at the end of each sentence "
        "where the number corresponds to the index in the context above. "
        "Example: 'Revenue grew 18% YoY [1]. The strategy targets EMEA [2].' "
        "If you don't know the answer, say you don't know."
    ))
    human_msg = HumanMessage(content=f"Context:\n{context}\n\nQuestion: {state['question']}")

    response = await llm.ainvoke([system_msg, human_msg])

    # Extract citations using regex — matches [1], [^1], [1,2], [1-3] patterns
    citations = []
    found_indices = set()
    for match in re.finditer(r'\[\^?(\d+)(?:[,\-\s]*\d*)*\]', response.content):
        idx = int(match.group(1))
        if 1 <= idx <= len(chunks) and idx not in found_indices:
            found_indices.add(idx)
            chunk = chunks[idx - 1]
            citations.append(Citation(
                n=idx,
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
