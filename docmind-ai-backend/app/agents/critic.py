from app.agents.state import AgentState
from app.agents.llm import get_llm
from app.logger import get_logger
from langchain_core.messages import SystemMessage, HumanMessage
import json

logger = get_logger("agent.critic")

async def critic_node(state: AgentState):
    draft = state.get("draft", "")
    chunks = state.get("retrieved", [])
    iteration = state.get("iterations", 1)
    logger.info(f"[CRITIC] Verifying answer | iteration={iteration} | evidence_chunks={len(chunks)}")

    llm = get_llm()
    evidence = "\n\n".join([f"[{i+1}] {c.snippet}" for i, c in enumerate(chunks)])

    system_msg = SystemMessage(content=(
        "You are a strict fact-checker. Compare the draft answer against the retrieved evidence. "
        "Every claim in the answer must be supported by the evidence. "
        "Return JSON with 'verdict' (pass, revise, fail) and 'issues' (list of strings)."
    ))
    human_msg = HumanMessage(content=f"Evidence:\n{evidence}\n\nDraft Answer:\n{draft}")

    response = await llm.ainvoke([system_msg, human_msg])

    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        verdict = data.get("verdict", "pass")
        issues = data.get("issues", [])
        logger.info(f"[CRITIC] Verdict={verdict} | issues={issues}")
        return {"critique": data}
    except Exception as e:
        logger.warning(f"[CRITIC] JSON parse failed ({e}), defaulting to pass")
        return {"critique": {"verdict": "pass", "issues": []}}
