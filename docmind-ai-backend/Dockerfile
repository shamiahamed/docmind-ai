FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install --upgrade pip
RUN pip install fastapi uvicorn python-multipart pydantic-settings python-jose[cryptography] langchain langchain-openai langgraph chromadb pypdf docx2txt openai httpx langchain-community supabase

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
