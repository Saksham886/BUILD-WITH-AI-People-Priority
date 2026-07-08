# Grievance Letter Generator

Standalone FastAPI microservice for Stage 3 of the citizen grievance pipeline. It accepts one aggregated incident payload, generates a formal government grievance letter, and renders an editable PDF on demand.

## Setup

```bash
pip install -r requirements.txt
```

Create a `.env` file from `.env.example` and set the provider key you want to use.

```env
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
LLM_PROVIDER=groq
```

Switch between providers with `LLM_PROVIDER=groq` or `LLM_PROVIDER=gemini`.

Run the service:

```bash
uvicorn main:app --reload
```

The server listens on `http://127.0.0.1:8000` by default and allows CORS from `http://localhost:5173`.

## Health Check

```bash
curl http://127.0.0.1:8000/health
```

Example response:

```json
{
  "status": "ok",
  "llm_provider": "groq"
}
```

## Generate Letter

```bash
curl -X POST http://127.0.0.1:8000/generate-letter \
  -H "Content-Type: application/json" \
  -d '{
    "master_incident_id": "cluster_9842",
    "title": "Water Supply Issue at Ward 4, Main Market area",
    "category": "Water Supply",
    "total_complaints_count": 42,
    "priority_score": 113.4,
    "aggregated_details": [
      {
        "summary": "Main water pipeline burst near the public square causing heavy flooding.",
        "location": "Near Main Market Square",
        "urgency": "High"
      }
    ]
  }'
```

Example response:

```json
{
  "master_incident_id": "cluster_9842",
  "department_routed_to": "The Chief Engineer, Jal Board",
  "letter_markdown": "OFFICE OF THE MEMBER OF PARLIAMENT\n...",
  "generated_at": "2026-07-07T12:00:00Z"
}
```

## Generate PDF

```bash
curl -X POST http://127.0.0.1:8000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "letter_markdown": "OFFICE OF THE MEMBER OF PARLIAMENT\nExample Constituency\n\n**SUBJECT: WATER SUPPLY ISSUE**\n\nDear Sir/Madam,\n\nA total of 42 complaints have been received regarding the water supply disruption in Ward 4.\n\n- Main water pipeline burst near the public square causing heavy flooding. (Location: Near Main Market Square)\n\nThe matter requires immediate field inspection and restoration within 48 hours.\n\nSincerely,\n[Member of Parliament]\n[Constituency Name]",
    "constituency_name": "Example Constituency",
    "mp_name": "Example MP"
  }' --output grievance_letter.pdf
```

The response is a binary PDF with `Content-Type: application/pdf` and a downloadable attachment filename.

## Sample Payload

```json
{
  "master_incident_id": "cluster_9842",
  "title": "Water Supply Issue at Ward 4, Main Market area",
  "category": "Water Supply",
  "total_complaints_count": 42,
  "priority_score": 113.4,
  "aggregated_details": [
    {
      "summary": "Main water pipeline burst near the public square causing heavy flooding.",
      "location": "Near Main Market Square",
      "urgency": "High"
    }
  ]
}
```
