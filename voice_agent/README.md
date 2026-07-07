# CivicAI — AI Multilingual Citizen Grievance Normalization Platform

> **Stage 1** of the AI Civic Intelligence Platform.
> Converts multilingual citizen complaints (voice or text) into a single standardized canonical problem statement.

---

## 🎯 What It Does

Different ways of describing the same issue → **identical output**:

| Input | Language |
|---|---|
| "There is no water." | English |
| "Kal se paani nahi aa raha." | Hinglish |
| "ನೀರು ಬರುತ್ತಿಲ್ಲ." | Kannada |
| "நீர் வரவில்லை." | Tamil |

**Output (always):**
```json
{ "canonical_problem": "Drinking water supply unavailable" }
```

---

## 🏗️ Architecture

```
React Frontend (Vite + Tailwind)
        ↓  Axios
FastAPI Backend
        ↓
  pipeline.py  (orchestrates all)
   ├── speech.py      → Faster Whisper (STT)
   ├── language.py    → langdetect
   ├── llm.py         → Ollama (Qwen2.5:7B)
   └── normalize.py   → JSON validation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS v4, Framer Motion, Axios |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| STT | Faster Whisper (`base` model, CPU) |
| LLM | Ollama → Qwen2.5:7B |
| Language Detection | langdetect |
| Logging | Loguru |

---

## 📦 Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running
- Qwen2.5:7B pulled in Ollama

---

## 🚀 Installation & Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd google_hackathon
```

### 2. Install Ollama & pull model

**Windows:**
```
Download from https://ollama.com/download
```

**After installing, pull the model:**
```bash
ollama pull qwen2.5:7b
ollama serve   # starts on http://localhost:11434
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example env file
copy .env.example .env

# Edit if needed (defaults work out of the box)
# WHISPER_DEVICE=cpu  → change to cuda if you have NVIDIA GPU
# WHISPER_MODEL_SIZE=base  → change to small for better accuracy
```

### 5. Frontend Setup

```bash
cd frontend
npm install
```

---

## ▶️ Running

### Start Backend

```bash
# From backend/ directory
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On first run, Faster Whisper will download the model (~150MB for `base`).

### Start Frontend

```bash
# From frontend/ directory (new terminal)
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## 🔌 API Documentation

### `GET /health`

Returns service status.

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "healthy",
  "ollama_reachable": true,
  "whisper_loaded": true
}
```

---

### `POST /text`

Submit a text complaint.

```bash
curl -X POST http://localhost:8000/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Kal se paani nahi aa raha hai"}'
```

```json
{ "canonical_problem": "Drinking water supply unavailable" }
```

---

### `POST /voice`

Upload an audio file.

```bash
curl -X POST http://localhost:8000/voice \
  -F "file=@complaint.webm"
```

```json
{ "canonical_problem": "Road damaged with potholes" }
```

**Supported formats:** `.webm`, `.mp3`, `.wav`, `.ogg`, `.m4a`, `.mp4`, `.flac`

---

### Interactive Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📁 Folder Structure

```
google_hackathon/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app factory + lifespan
│   │   ├── config.py            # Pydantic Settings (env vars)
│   │   ├── routes/
│   │   │   ├── upload.py        # POST /voice, POST /text
│   │   │   └── health.py        # GET /health
│   │   ├── services/
│   │   │   ├── pipeline.py      # Orchestrator (chains all services)
│   │   │   ├── speech.py        # Faster Whisper STT
│   │   │   ├── language.py      # langdetect
│   │   │   ├── llm.py           # Ollama HTTP client
│   │   │   └── normalize.py     # JSON parser + validator
│   │   ├── schemas/
│   │   │   ├── request.py       # TextRequest
│   │   │   └── response.py      # CanonicalResponse, HealthResponse
│   │   ├── prompts/
│   │   │   └── canonical_problem.txt
│   │   └── utils/
│   │       ├── logger.py        # Loguru setup
│   │       └── helpers.py       # save/cleanup temp files, build prompt
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── VoiceRecorder.jsx
│   │   │   ├── TextInput.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ResultCard.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.local
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🧠 Supported Languages

| Language | Script | Code-mix Support |
|---|---|---|
| English | Latin | ✅ |
| Hindi | Devanagari | ✅ Hinglish |
| Kannada | Kannada script | ✅ Kanglish |
| Telugu | Telugu script | ✅ Telugu+English |
| Tamil | Tamil script | ✅ Tanglish |
| Marathi, Gujarati, Bengali, Malayalam | Native | ✅ Partial |

---

## ⚙️ Whisper Model Options

| Model | Size | Speed (CPU) | Accuracy |
|---|---|---|---|
| `tiny` | ~75MB | Very fast | Basic |
| `base` | ~150MB | Fast | Good (**default**) |
| `small` | ~500MB | Moderate | Better |
| `medium` | ~1.5GB | Slow | High |

Change in `.env`:
```
WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cuda   # if NVIDIA GPU available
```

---

## 🔮 Future Roadmap (Stage 2+)

The backend is architected for easy extension:

| Module | Status |
|---|---|
| Sentence Embeddings (`sentence-transformers`) | Planned |
| DBSCAN Clustering (`scikit-learn`) | Planned |
| Priority Engine | Planned |
| PDF Letter Generator | Planned |
| Interactive Civic Map | Planned |
| Government Dashboard | Planned |

To add Stage 2: create `app/services/embedding.py` and `app/services/clustering.py`, then wire into `pipeline.py`.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `Ollama is not reachable` | Run `ollama serve` in a terminal |
| `qwen2.5:7b not found` | Run `ollama pull qwen2.5:7b` |
| Whisper takes long | First run downloads model; subsequent runs are instant |
| CORS error in browser | Ensure backend is on port 8000 and frontend on 5173 |
| Empty transcription | Speak clearly; increase recording duration |

---

## 📄 License

MIT License — Free to use and modify.
