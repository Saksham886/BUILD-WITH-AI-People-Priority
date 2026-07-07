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
