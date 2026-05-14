from app.agents.state import AgentState
from app.agents.llm import get_llm
from app.logger import get_logger
from langchain_core.messages import SystemMessage, HumanMessage
import json

logger = get_logger("agent.supervisor")

async def supervisor_node(state: AgentState):
    logger.info(f"[SUPERVISOR] Planning for: '{state['question']}'")
    llm = get_llm()

    system_msg = SystemMessage(content=(
        "You are the supervisor of a multi-agent RAG system. "
        "Analyze the user question and decide which specialist agents to call. "
        "Available agents:\n"
        "- retriever: General search for info.\n"
        "- comparison: Comparing data across multiple documents or sections.\n"
        "- summarizer: Summarizing large sections or whole documents.\n"
        "- math_table: Extracting numbers/tables or performing calculations.\n\n"
        "Return a JSON object with 'intent' (qa, compare, summarize, compute) and 'plan' (list of {agent, task})."
    ))

    human_msg = HumanMessage(content=f"Question: {state['question']}")

    response = await llm.ainvoke([system_msg, human_msg])

    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        intent = data.get("intent", "qa")
        plan = data.get("plan", [])
        logger.info(f"[SUPERVISOR] Intent={intent} | Plan={[p['agent'] for p in plan]}")
        return {
            "intent": intent,
            "plan": plan,
            "iterations": state.get("iterations", 0) + 1
        }
    except Exception as e:
        logger.warning(f"[SUPERVISOR] JSON parse failed ({e}), falling back to qa/retriever")
        return {
            "intent": "qa",
            "plan": [{"agent": "retriever", "task": "Find info to answer the question"}],
            "iterations": state.get("iterations", 0) + 1
        }
