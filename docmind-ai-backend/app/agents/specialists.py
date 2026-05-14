from app.agents.state import AgentState
from app.agents.llm import get_llm
from app.logger import get_logger
from langchain_core.messages import SystemMessage, HumanMessage

logger = get_logger("agent.specialists")

async def comparison_node(state: AgentState):
    chunks = state.get("retrieved", [])
    logger.info(f"[COMPARISON] Aligning {len(chunks)} chunks")
    llm = get_llm()

    context = "\n\n".join([f"Source {i+1}: {c.snippet}" for i, c in enumerate(chunks)])
    system_msg = SystemMessage(content="You are a comparison expert. Align and compare data points found in the sources. Focus on differences and similarities.")
    human_msg = HumanMessage(content=f"Context:\n{context}\n\nTask: Compare findings for '{state['question']}'")

    response = await llm.ainvoke([system_msg, human_msg])
    logger.info(f"[COMPARISON] Done | output_len={len(response.content)}")

    return {
        "scratchpad": state.get("scratchpad", []) + [{"agent": "comparison", "output": response.content}]
    }

async def summarizer_node(state: AgentState):
    chunks = state.get("retrieved", [])
    logger.info(f"[SUMMARIZER] Condensing {len(chunks)} chunks")
    llm = get_llm()

    context = "\n\n".join([c.snippet for c in chunks])
    system_msg = SystemMessage(content="You are a summarization expert. Condense the information into a concise summary while retaining key facts.")
    human_msg = HumanMessage(content=f"Text to summarize:\n{context}")

    response = await llm.ainvoke([system_msg, human_msg])
    logger.info(f"[SUMMARIZER] Done | output_len={len(response.content)}")

    return {
        "scratchpad": state.get("scratchpad", []) + [{"agent": "summarizer", "output": response.content}]
    }

async def math_table_node(state: AgentState):
    logger.info("[MATH_TABLE] Extracting data")
    return {
        "scratchpad": state.get("scratchpad", []) + [{"agent": "math_table", "output": "Extracted key numbers."}]
    }
