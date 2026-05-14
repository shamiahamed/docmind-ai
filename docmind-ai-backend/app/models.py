from pydantic import BaseModel
from typing import Literal, List, Optional

class AgentTask(BaseModel):
    agent: Literal["supervisor", "retriever", "comparison", "summarizer", "math_table", "synthesizer", "critic"]
    task: str

class ChunkRef(BaseModel):
    doc_id: str
    doc_name: str
    page: int
    chunk_id: str
    score: Optional[float] = None
    snippet: Optional[str] = None

class Citation(BaseModel):
    n: int
    doc_id: str
    doc_name: str
    page: int
    chunk_id: str

class Critique(BaseModel):
    verdict: Literal["pass", "revise", "fail"]
    issues: List[str] = []

class ChatRequest(BaseModel):
    conversation_id: str
    question: str

class DocumentRow(BaseModel):
    id: str
    filename: str
    size_bytes: int
    mime_type: Optional[str]
    status: str
    pages: Optional[int] = None
    chunks: Optional[int] = None
    created_at: str
