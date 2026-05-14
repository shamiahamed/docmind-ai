# DocMind AI — Multi-Agent Document Intelligence

DocMind is a high-performance RAG (Retrieval-Augmented Generation) platform that uses a team of AI agents to analyze your documents with extreme accuracy and grounding.

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)
1. **Navigate to backend**: `cd docmind-ai-backend`
2. **Install Dependencies**: `pip install -r requirements.txt`
3. **Environment**: Ensure your `.env` has:
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`
4. **Run**: `uvicorn app.main:app --reload`

### 2. Frontend Setup (React/Vite)
1. **Navigate to frontend**: `cd docmind-ai`
2. **Install Dependencies**: `npm install`
3. **Environment**: Ensure `.env` has:
   - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE=http://localhost:8000`
4. **Run**: `npm run dev`

---

## 🧠 Working Process (Multi-Agent RAG)

When you ask a question about a document, the following "Brain" process occurs:

1. **The Supervisor**: Analyzes your question and creates a plan. It decides which specialized agents (Summarizer, Math specialist, etc.) are needed.
2. **The Retriever**: Searches your uploaded PDF using ChromaDB vector search to find the exact pages you are asking about.
3. **The Specialists**: Process the raw text. (e.g., The Summarizer condenses long sections).
4. **The Synthesizer**: Drafts the final answer based ONLY on the retrieved facts.
5. **The Critic (Crucial)**: Verifies the answer against the source text. If the AI "hallucinates" or makes a mistake, the Critic sends it back for correction.
6. **Streaming**: The final verified answer is streamed to your UI in real-time.

---

## 🛡️ Database & Security
- **Auth**: Managed by Supabase.
- **RLS**: Row Level Security ensures users can ONLY see their own uploaded documents.
- **Vector Search**: ChromaDB stores document embeddings for lightning-fast retrieval.

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Router.
- **Backend**: Python, FastAPI, LangGraph (Multi-Agent Orchestration), LangChain.
- **AI**: OpenRouter (Auto-selecting the best model).
