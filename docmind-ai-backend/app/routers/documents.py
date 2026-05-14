from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
from app.models import DocumentRow
from app.deps import get_current_user
from app.ingest.parser import parse_and_chunk
from app.ingest.embedder import add_documents_to_store
from app.lib.supabase import get_supabase
from app.logger import get_logger
import uuid
import os
import shutil
from datetime import datetime

router = APIRouter()
logger = get_logger("router.documents")

async def process_document_task(doc_id: str, user_id: str, file_path: str, filename: str):
    supabase = get_supabase()
    try:
        logger.info(f"[PROCESS] Starting background task for {doc_id}")
        
        # 1. Update status to parsing
        supabase.table("documents").update({"status": "parsing"}).eq("id", doc_id).execute()
            
        # 2. Parse and Chunk
        chunks = await parse_and_chunk(file_path, doc_id, filename)
        
        # Update status to embedding
        pages = len(set(c.metadata.get("page", 0) for c in chunks))
        supabase.table("documents").update({
            "status": "embedding",
            "pages": pages
        }).eq("id", doc_id).execute()
        
        # 3. Embed and Store
        await add_documents_to_store(user_id, chunks)
        
        # 4. Finalize
        supabase.table("documents").update({
            "status": "ready",
            "chunks": len(chunks)
        }).eq("id", doc_id).execute()
        
        logger.info(f"[PROCESS] Document {doc_id} is READY")
                
    except Exception as e:
        logger.error(f"[PROCESS] Failed for {doc_id}: {e}", exc_info=True)
        supabase.table("documents").update({"status": "failed"}).eq("id", doc_id).execute()
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/", response_model=List[DocumentRow])
async def list_documents(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    # Fetch from Supabase instead of memory
    response = supabase.table("documents").select("*").eq("user_id", user["user_id"]).order("created_at", desc=True).execute()
    return response.data

@router.post("/", status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    doc_id = str(uuid.uuid4())
    user_id = user["user_id"]
    
    logger.info(f"[UPLOAD] Received '{file.filename}' from user {user_id}")
    
    # Save file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{doc_id}_{file.filename}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create record in Supabase
    supabase = get_supabase()
    doc_data = {
        "id": doc_id,
        "user_id": user_id,
        "filename": file.filename,
        "size_bytes": os.path.getsize(temp_path),
        "mime_type": file.content_type,
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "pages": 0,
        "chunks": 0
    }
    
    try:
        supabase.table("documents").insert(doc_data).execute()
        logger.info(f"[UPLOAD] Row created in Supabase for {doc_id}")
    except Exception as e:
        logger.error(f"[UPLOAD] Database insert failed: {e}")
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(status_code=500, detail="Failed to register document")
    
    # Start background processing
    background_tasks.add_task(process_document_task, doc_id, user_id, temp_path, file.filename)
    
    return doc_data

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    # Check ownership
    doc = supabase.table("documents").select("user_id").eq("id", doc_id).single().execute()
    if not doc.data or doc.data["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete from DB
    supabase.table("documents").delete().eq("id", doc_id).execute()
    
    # Note: In a full implementation, we should also delete chunks from ChromaDB
    logger.info(f"[DELETE] Document {doc_id} removed")
    return {"status": "deleted"}
