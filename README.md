# AI Study Assistant

A full-stack AI-powered study platform. Upload notes, chat with AI, generate summaries, flashcards, and quizzes.

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **AI**: OpenAI GPT-4o-mini

## Setup

### 1. Clone and install

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-study-assistant
JWT_SECRET=any_random_secret
OPENAI_API_KEY=sk-...
```

### 3. Run

```bash
# Terminal 1 — server
cd server
npm run dev

# Terminal 2 — client
cd client
npm run dev
```

Open http://localhost:5173

## Features
- JWT auth (register/login)
- Upload PDFs or paste text
- AI chat with your notes
- AI summaries (short/detailed/bullets/exam mode)
- Flashcard generator with flip animation
- Quiz generator with scoring and explanations
