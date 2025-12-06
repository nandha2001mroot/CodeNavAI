<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

🚀 AI Codebase Navigator

Intelligent code understanding powered by Gemini 3 Pro

AI Codebase Navigator is a developer tool that allows users to upload an entire repository and explore it through natural-language queries. Using Gemini 3 Pro’s advanced reasoning and multimodal embeddings, the system provides accurate code explanations, bug analysis, architecture insights, and file-level citations without hallucinations.

⭐ Features
🔍 Deep Code Understanding

Ask natural-language questions and get answers grounded in real files.

🧠 Advanced Reasoning (Gemini 3 Pro)

Traces dependencies, explains architecture, finds issues, and summarizes logic.

📁 Project Explorer

Upload a repo, browse the folder tree, and inspect files with syntax highlighting.

🐞 Debugging Assistance

Identify root causes of bugs with supporting file citations.

🔐 Security Insights

Detect common insecure patterns and suggest safe alternatives.

🧹 Refactoring Suggestions

Improve clarity, reduce duplication, and modernize code style.

🧠 No Hallucinations

Uses a RAG pipeline + file/line citations to guarantee grounded responses.

🧩 Architecture Overview
User → React UI → FastAPI Backend → Chroma Vector DB → Gemini 3 Pro

Process Flow

File Upload – User uploads a repository ZIP

Parsing & Chunking – Backend parses files and splits code into structured chunks

Embeddings – Gemini embeddings generated for each code chunk

Vector Search – ChromaDB retrieves most relevant code snippets

Prompt Building – Repository summary + code context combined

Gemini Reasoning – Model answers using multi-file reasoning and citations

UI Display – Answer is streamed to the chat view with referenced files

🛠 Tech Stack
AI & Processing

Gemini 3 Pro

Gemini Embeddings

Custom prompt builder

RAG pipeline (retrieval-augmented generation)

Backend

FastAPI (Python 3.11)

ChromaDB vector search

Pydantic models

Secure file-handling and repository parser

Frontend

React + Vite

Tailwind CSS

CodeMirror for syntax highlighting

WebSocket streaming for AI responses

DevOps

Docker & Docker Compose

Optional deployment: Google Cloud Run / GCP

📦 Project Structure
ai-codebase-navigator/
│── backend/
│   ├── main.py
│   ├── prompt_builder.py
│   ├── repo_parser.py
│   ├── embeddings.py
│   ├── rag_engine.py
│   ├── routes/
│   ├── models/
│   ├── utils/
│   └── Dockerfile
│
│── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── Dockerfile
│
│── docker-compose.yml
│── README.md
│── sample_data/

⚙️ Setup Instructions
1️⃣ Clone the repository
git clone https://github.com/your-repo/ai-codebase-navigator
cd ai-codebase-navigator

2️⃣ Set environment variables

Create .env in /backend:

GEMINI_API_KEY=your_key_here

3️⃣ Start backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

4️⃣ Start frontend
cd frontend
npm install
npm run dev

🧠 How to Use

Open the web UI

Upload your codebase ZIP

Explore the folder tree

Ask questions like:

“Where is authentication implemented?”

“Why does the login function fail?”

“Explain the architecture.”

“Find possible security vulnerabilities.”

See code citations and explanations instantly

🧪 Example Questions

“Explain what this function does and which files call it.”

“Find all APIs that touch the database.”

“Why does this endpoint throw an error?”

“Summarize the entire repository architecture.”


💡 Future Improvements

Multi-language code support (Java, Go, C++)

VS Code extension

Real-time GitHub repo integration

Automatic documentation generation

CI-powered continuous analysis

🙌 Acknowledgements

Built using Gemini 3 Pro, Google AI Studio, and modern open-source tooling.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QiSjg9ph3m3A4BVKNPib4QfpRDrw_kkN

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
