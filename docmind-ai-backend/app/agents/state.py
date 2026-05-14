from typing import TypedDict, List, Literal, Optional
from app.models import AgentTask, ChunkRef, Citation, Critique

class AgentState(TypedDict, total=False):
    user_id: str
    conversation_id: str
    question: str
    intent: Literal["qa", "compare", "summarize", "compute"]
    plan: List[AgentTask]
    scratchpad: List[dict]
    retrieved: List[ChunkRef]
    draft: str
    citations: List[Citation]
    critique: Critique
    iterations: int
    next_step: str
