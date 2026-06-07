from app.agents.state import AgentState
from app.agents.llm import get_llm
from app.logger import get_logger
from langchain_core.messages import SystemMessage, HumanMessage
import json
import re

logger = get_logger("agent.critic")

def _extract_json(text: str) -> dict | None:
    strategies = [
        # 1. Direct parse after stripping markdown fences
        lambda t: json.loads(t.replace("```json", "").replace("```", "").strip()),
        # 2. Find first { ... } block
        lambda t: json.loads(t[t.index("{"):t.rindex("}")+1]),
        # 3. Find JSON code fence specifically
        lambda t: json.loads(re.search(r"```(?:json)?\s*(\{.*?\})\s*```", t, re.DOTALL).group(1)),
    ]
    for fn in strategies:
        try:
            return fn(text)
        except (ValueError, AttributeError, TypeError):
            continue
    return None

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
        "Return ONLY valid JSON with no markdown formatting: "
        '{"verdict": "pass"|"revise"|"fail", "issues": ["issue1", "issue2"]}'
    ))
    human_msg = HumanMessage(content=f"Evidence:\n{evidence}\n\nDraft Answer:\n{draft}")

    response = await llm.ainvoke([system_msg, human_msg])

    data = _extract_json(response.content)
    if data:
        verdict = data.get("verdict", "pass")
        issues = data.get("issues", [])
        logger.info(f"[CRITIC] Verdict={verdict} | issues={issues}")
        return {"critique": data}

    logger.warning(f"[CRITIC] JSON parse failed, defaulting to pass")
    return {"critique": {"verdict": "pass", "issues": []}}
