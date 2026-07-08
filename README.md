# Build with AI — Citizen Grievance Pipeline

This repo now hosts all three stages of the **"Build with AI"** citizen-grievance pipeline
side by side, plus a single unified frontend that ties them together end-to-end:

| Stage | Folder | What it does |
|-------|--------|---------------|
| 1 — Ingestion | `voice_agent/` | Normalizes a voice/text complaint (any Indian language) into a canonical problem statement. |
| 2 — Aggregation | `backend/`, `frontend/` | Embeds + clusters complaints into Master Incidents ranked by priority. **The unified frontend lives here.** |
| 3 — Action | `letter_service/` | Turns a Master Incident into a formal grievance letter + downloadable PDF. |

`voice_agent/frontend` is kept as the original standalone reference app (and as the
source of the dark "glass" visual design), but day-to-day use goes through the unified
`frontend/` app below, which has an **Intake** page (Stage 1) and a **Dashboard** page
(Stage 2) with a **Generate Letter** action per incident (Stage 3) — real data flows
between all three, not just shared styling.

## Running all three backends

Each backend is independent (own venv/dependencies) — start them on distinct ports:

```bash
# Stage 2 — aggregation backend (this repo's own backend/)
cd backend && uvicorn app.main:app --reload --port 8000

# Stage 1 — voice_agent backend
cd voice_agent/backend && uvicorn app.main:app --reload --port 8001

# Stage 3 — letter_service
cd letter_service && uvicorn main:app --reload --port 8002
```

Then run the unified frontend (proxies `/api` → 8000, `/voice-api` → 8001,
`/letters-api` → 8002 — see `frontend/vite.config.js`):

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 — **Intake** submits a grievance through Stage 1 and forwards
it into Stage 2's cluster list; **Dashboard** shows Master Incidents and lets you generate
a Stage 3 letter/PDF for any of them.

---

# Stage 2 — Aggregation (Semantic Text Clustering & Counting)

Part of the **"Build with AI"** 3-stage citizen-grievance pipeline
(Stage 1 Ingestion → **Stage 2 Aggregation** → Stage 3 Action).

This module takes the structured grievance JSON produced by Stage 1, **embeds** each
complaint summary, **clusters** semantically-similar complaints into a single
**Master Incident** (so 50 voice notes about the "broken water pipeline near Main Market"
collapse into one), and computes:

```
Priority Score = complaint count × urgency multiplier   (High=3, Medium=2, Low=1)
```

## Tech stack
- **Backend:** Python + FastAPI
- **Embeddings:** `all-MiniLM-L6-v2` via `sentence-transformers` (local, no API key)
- **Clustering:** DBSCAN (cosine) from `scikit-learn`
- **Storage:** SQLite (grievances + cached vectors survive restarts)
- **Frontend:** React (Vite) + TailwindCSS

---

## 1. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:  source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Interactive API docs: http://localhost:8000/docs
- First launch downloads the ~90MB MiniLM model once (needs internet), then runs offline.
- Config is env-driven — copy `.env.example` to `.env` to tune `DBSCAN_EPS`, the model, etc.

### Endpoints
| Method | Path            | Purpose                                                  |
|--------|-----------------|----------------------------------------------------------|
| POST   | `/ingest`       | Add one grievance or a list (embeds + stores).           |
| POST   | `/ingest/seed`  | Load built-in sample grievances for the demo.            |
| GET    | `/grievances`   | List raw stored grievances.                              |
| GET    | `/get-clusters` | **Master Incidents ranked by priority score.**           |
| DELETE | `/reset`        | Clear all grievances.                                    |
| GET    | `/health`       | Health check.                                            |

### Grievance JSON (Stage 1 → Stage 2 contract)
```json
{
  "summary": "The water pipeline near Main Market has burst.",
  "category": "Water Supply",
  "urgency": "High",
  "location": "Main Market",
  "language": "English",
  "transcript": "optional raw transcript"
}
```
Only `summary` is required; the rest have sensible defaults.

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173). The dev server proxies `/api/*`
to the backend on port 8000, so run the backend first.

The dashboard lets you **Load sample data**, **add a grievance** (to watch a cluster's
count and priority rise live), and view **Master Incident cards** ranked by priority with
expandable citizen statements.

---

## Tuning the clustering
`DBSCAN_EPS` (cosine distance, 0–1, default **0.6**) controls how aggressively
complaints merge:
- **Lower** (e.g. 0.45) → stricter, fewer merges, more distinct incidents.
- **Higher** (e.g. 0.7) → looser, more complaints grouped together.

`0.6` is tuned for `all-MiniLM-L6-v2`: it groups paraphrased and code-switched
(Hinglish) complaints about the same issue while keeping distinct incidents apart.

Set it in `backend/.env`. `DBSCAN_MIN_SAMPLES=1` ensures unique complaints still become
their own (singleton) Master Incident rather than being dropped as noise.
