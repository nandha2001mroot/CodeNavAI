<p align="center">
  <img src="/mnt/data/Gemini_Generated_Image_mnxuvgmnxuvgmnxu.png" width="80%" alt="CodeNavAI Logo"/>
</p>

<h1 align="center">⚡ CodeNavAI</h1>
<h3 align="center">AI Codebase Navigator — Understand Any Codebase Instantly</h3>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Gemini%203%20Pro-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Framework-FastAPI-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Frontend-React-lightblue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/RAG-Enabled-purple?style=for-the-badge"/>
</p>

---

## 🎥 Demo (GIF)
<p align="center">
  <!-- Replace this with your GIF once uploaded -->
  <img src="YOUR_GIF_HERE.gif" width="80%" alt="CodeNavAI Demo GIF"/>
</p>

---

## 📌 Overview

**CodeNavAI** is an intelligent, developer-focused platform that allows users to upload an entire codebase and query it using natural language.  
Powered by **Gemini 3 Pro**, the system delivers highly accurate:

- Code explanations  
- Bug diagnosis  
- Architecture summaries  
- Security insights  
- Dependency tracing  
- Refactoring suggestions  

All responses are grounded with **file-level citations**, ensuring **zero hallucinations** using a robust **RAG pipeline**.

---

## ✨ Features

### 🔍 Deep Code Understanding  
Ask natural language questions and get grounded answers with file citations.

### 🧠 Gemini 3 Pro Reasoning  
Advanced multi-file reasoning to explain architecture, flows, and issues.

### 📁 File Explorer  
Upload a project and browse all folders/files with syntax highlighting.

### 🐞 Debug & Diagnose  
Find root causes of errors with referenced code snippets.

### 🔐 Security Insights  
Detect insecure code patterns and suggest safe alternatives.

### 🧹 Refactoring Suggestions  
Improve code clarity, reduce duplication, and modernize structure.

### 🚫 Hallucination Prevention  
RAG pipeline + file/line-level citations ensures trustworthiness.

---

## 📸 Screenshots

### 🔹 Code Navigation + AI Reasoning
<p align="center">
  <img src="/mnt/data/one.png" width="90%" />
</p>

---

### 🔹 Project Navigator — Upload & Explore Codebases
<p align="center">
  <img src="/mnt/data/two.png" width="90%" />
</p>

---

## 🧩 Architecture Overview

User → React UI → FastAPI Backend → Chroma Vector DB → Gemini 3 Pro

markdown
Copy code

### 🔧 Process Flow

1. **Upload ZIP Folder**  
2. **Repository Parse & Chunking**  
3. **Gemini Embeddings Generated**  
4. **Vector Search via ChromaDB**  
5. **Prompt Builder Constructs Context**  
6. **Gemini 3 Pro Reasoning**  
7. **Streaming UI Response + Citations**

---

## 🛠 Tech Stack

### 🌐 Frontend
- React + Vite  
- Tailwind CSS  
- CodeMirror  
- WebSocket Streaming  

### ⚙️ Backend
- FastAPI  
- Python 3.11  
- ChromaDB  
- Gemini 3 Pro API  
- Custom RAG pipeline  
- Secure repo parser  

### 🧠 AI & Processing
- Gemini 3 Pro (reasoning)
- Gemini Embeddings  
- Prompt Builder  
- Multi-file Analysis Engine  

### 🐳 DevOps
- Docker & Docker Compose  
- Deployable on Google Cloud Run  

---

## 📦 Project Structure

ai-codebase-navigator/
│── backend/
│ ├── main.py
│ ├── prompt_builder.py
│ ├── repo_parser.py
│ ├── embeddings.py
│ ├── rag_engine.py
│ ├── routes/
│ ├── models/
│ ├── utils/
│ └── Dockerfile
│
│── frontend/
│ ├── src/
│ ├── components/
│ ├── pages/
│ ├── App.jsx
│ ├── main.jsx
│ └── Dockerfile
│
│── docker-compose.yml
│── README.md
│── sample_data/

yaml
Copy code

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/your-repo/ai-codebase-navigator
cd ai-codebase-navigator
2️⃣ Backend Setup
bash
Copy code
cd backend
pip install -r requirements.txt
Create .env:

ini
Copy code
GEMINI_API_KEY=your_api_key
Start backend:

bash
Copy code
uvicorn main:app --reload
3️⃣ Frontend Setup
bash
Copy code
cd frontend
npm install
npm run dev
🧠 How to Use CodeNavAI
Open the web UI

Upload your project folder or ZIP

Let CodeNavAI index & analyze your code

Ask questions such as:

“Where is authentication implemented?”

“Why is this endpoint failing?”

“Summarize the architecture.”

“Find potential security vulnerabilities.”

“Explain how state is managed in this React app.”

View AI-generated answers with file-level citations.

🧪 Example Queries
“Explain what this function does and who calls it.”

“Find all database queries across the project.”

“Which files contribute to the login flow?”

“Why does the server crash when sending POST requests?”

“Summarize the repository architecture.”

“Suggest improvements for code readability.”

🚀 Future Improvements
Multi-language support (Java, Go, C++, PHP, Rust)

VS Code extension

GitHub repo ingestion

Auto-documentation generator

AI-powered code search

Real-time continuous analysis (CI plugin)

❤️ Acknowledgements
Built using:

Gemini 3 Pro

Google AI Studio

FastAPI, React, ChromaDB

Open-source developer tools

📄 License
MIT License — Free for personal & commercial use.

⭐ Support the Project
If you like this project, give it a ⭐ on GitHub!


