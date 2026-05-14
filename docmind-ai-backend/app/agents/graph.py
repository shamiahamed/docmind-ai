from langgraph.graph import StateGraph, START, END
from app.agents.state import AgentState
from app.agents.supervisor import supervisor_node
from app.agents.retriever import retriever_node
from app.agents.specialists import comparison_node, summarizer_node, math_table_node
from app.agents.synthesizer import synthesizer_node
from app.agents.critic import critic_node

def router(state: AgentState):
    # If critic failed and we have iterations left, go back to supervisor
    if state.get("critique", {}).get("verdict") == "fail" and state.get("iterations", 0) < 2:
        return "supervisor"
    
    # If we have a plan, execute the next agent in the plan that hasn't been called
    # Or just follow a fixed order for simplicity in the first multi-agent version
    if not state.get("retrieved"):
        return "retriever"
    
    intent = state.get("intent", "qa")
    if intent == "compare" and not any(s["agent"] == "comparison" for s in state.get("scratchpad", [])):
        return "comparison"
    if intent == "summarize" and not any(s["agent"] == "summarizer" for s in state.get("scratchpad", [])):
        return "summarizer"
    
    return "synthesizer"

def should_continue(state: AgentState):
    if state.get("critique", {}).get("verdict") == "pass" or state.get("iterations", 0) >= 2:
        return END
    return "supervisor"

# Build Graph
builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("retriever", retriever_node)
builder.add_node("comparison", comparison_node)
builder.add_node("summarizer", summarizer_node)
builder.add_node("math_table", math_table_node)
builder.add_node("synthesizer", synthesizer_node)
builder.add_node("critic", critic_node)

builder.add_edge(START, "supervisor")

# Dynamic routing from supervisor
builder.add_conditional_edges("supervisor", router, {
    "retriever": "retriever",
    "comparison": "comparison",
    "summarizer": "summarizer",
    "synthesizer": "synthesizer"
})

builder.add_edge("retriever", "supervisor")
builder.add_edge("comparison", "supervisor")
builder.add_edge("summarizer", "supervisor")
builder.add_edge("synthesizer", "critic")
builder.add_conditional_edges("critic", should_continue)

graph = builder.compile()
