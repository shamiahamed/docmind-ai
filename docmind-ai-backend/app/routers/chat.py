from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.models import ChatRequest
from app.deps import get_current_user
from app.agents.graph import graph
from app.logger import get_logger
import json
import time

router = APIRouter()
logger = get_logger("router.chat")

async def event_generator(request: ChatRequest, user: dict):
    user_id = user["user_id"]
    start_time = time.time()
    logger.info(f"[CHAT] Stream started | user={user_id} | question='{request.question[:80]}'")

    inputs = {
        "user_id": user_id,
        "conversation_id": request.conversation_id,
        "question": request.question,
        "iterations": 0,
        "retrieved": [],
        "scratchpad": []
    }

    try:
        async for event in graph.astream_events(inputs, version="v2"):
            kind = event["event"]
            name = event["name"]

            # 1. Agent Start
            if kind == "on_chain_start" and name in ["supervisor", "retriever", "synthesizer", "critic", "comparison", "summarizer", "math_table"]:
                task = "Working..."
                if name == "retriever":   task = "Searching documents"
                elif name == "synthesizer": task = "Drafting answer"
                elif name == "critic":     task = "Verifying claims"
                elif name == "comparison": task = "Aligning data points"
                elif name == "summarizer": task = "Condensing information"
                logger.info(f"[CHAT] agent_start → {name}")
                yield f"data: {json.dumps({'type': 'agent_start', 'agent': name, 'task': task})}\n\n"

            # 2. Agent End
            elif kind == "on_chain_end" and name in ["supervisor", "retriever", "synthesizer", "critic", "comparison", "summarizer", "math_table"]:
                output = event["data"].get("output", {})
                summary = "Done"
                if name == "retriever":   summary = f"Found {len(output.get('retrieved', []))} chunks"
                elif name == "synthesizer": summary = "Answer generated"
                elif name == "critic":     summary = f"Verdict: {output.get('critique', {}).get('verdict')}"

                logger.info(f"[CHAT] agent_end   → {name} | {summary}")
                yield f"data: {json.dumps({'type': 'agent_end', 'agent': name, 'summary': summary, 'ms': 0})}\n\n"

                if name == "retriever" and "retrieved" in output:
                    yield f"data: {json.dumps({'type': 'retrieval', 'chunks': [c.model_dump() for c in output['retrieved']]})}\n\n"
                if name == "synthesizer" and "citations" in output:
                    for cit in output["citations"]:
                        yield f"data: {json.dumps({'type': 'citation', **cit.model_dump()})}\n\n"
                if name == "critic" and "critique" in output:
                    yield f"data: {json.dumps({'type': 'critic', **output['critique']})}\n\n"

            # 3. Token Streaming
            elif kind == "on_chat_model_stream" and event["metadata"].get("langgraph_node") == "synthesizer":
                delta = event["data"]["chunk"].content
                if delta:
                    yield f"data: {json.dumps({'type': 'token', 'delta': delta})}\n\n"

    except Exception as e:
        logger.error(f"[CHAT] Stream error | user={user_id} | {type(e).__name__}: {e}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    elapsed = round((time.time() - start_time) * 1000)
    logger.info(f"[CHAT] Stream complete | user={user_id} | elapsed={elapsed}ms")
    yield f"data: {json.dumps({'type': 'done', 'message_id': 'final', 'usage': {'tokens': 0, 'ms': elapsed}})}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
    return StreamingResponse(
        event_generator(request, user),
        media_type="text/event-stream"
    )
