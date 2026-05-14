import os
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.logger import get_logger

logger = get_logger("ingest.parser")

async def parse_and_chunk(file_path: str, doc_id: str, doc_name: str):
    ext = os.path.splitext(file_path)[1].lower()
    logger.info(f"[PARSER] Starting | doc={doc_name} | type={ext}")

    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".docx":
        loader = Docx2txtLoader(file_path)
    else:
        logger.error(f"[PARSER] Unsupported file type: {ext}")
        raise ValueError(f"Unsupported file type: {ext}")

    docs = loader.load()
    logger.info(f"[PARSER] Loaded {len(docs)} pages/sections from '{doc_name}'")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(docs)

    for i, chunk in enumerate(chunks):
        chunk.metadata.update({
            "doc_id": doc_id,
            "doc_name": doc_name,
            "chunk_id": f"{doc_id}_{i}",
            "page": chunk.metadata.get("page", 0)
        })

    logger.info(f"[PARSER] Done | doc={doc_name} | chunks={len(chunks)}")
    return chunks
