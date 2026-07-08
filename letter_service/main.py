import json
import logging
from datetime import datetime, timezone
from io import BytesIO

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import get_settings
from department_lookup import resolve_department
from llm_client import LLMClient, LLMGenerationError
from models import GenerateLetterResponse, GeneratePDFRequest, HealthResponse, MasterIncident
from pdf_generator import generate_pdf_bytes
from prompt_templates import build_system_prompt, build_user_prompt


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("grievance-letter-generator")

settings = get_settings()
llm_client = LLMClient(settings)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _iso_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _log_event(event: str, **fields: object) -> None:
    payload = {"event": event, **fields}
    logger.info(json.dumps(payload, default=str))


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    _log_event("health_check", success=True, llm_provider=llm_client.active_provider)
    return HealthResponse(status="ok", llm_provider=llm_client.active_provider)


@app.post("/generate-letter", response_model=GenerateLetterResponse)
async def generate_letter(incident: MasterIncident) -> GenerateLetterResponse:
    department = resolve_department(incident.category)
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(incident, department)
    started_at = datetime.now(timezone.utc)

    try:
        letter_markdown = await llm_client.generate(system_prompt, user_prompt)
    except LLMGenerationError as exc:
        _log_event(
            "generate_letter_failed",
            master_incident_id=incident.master_incident_id,
            department_routed_to=department.title,
            llm_latency_ms=int((datetime.now(timezone.utc) - started_at).total_seconds() * 1000),
            success=False,
            error=str(exc),
        )
        raise HTTPException(status_code=502, detail="LLM generation failed after retry. Please try again later.") from exc

    latency_ms = int((datetime.now(timezone.utc) - started_at).total_seconds() * 1000)
    _log_event(
        "generate_letter_success",
        master_incident_id=incident.master_incident_id,
        department_routed_to=department.title,
        llm_latency_ms=latency_ms,
        success=True,
    )

    return GenerateLetterResponse(
        master_incident_id=incident.master_incident_id,
        department_routed_to=department.title,
        letter_markdown=letter_markdown,
        generated_at=_iso_timestamp(),
    )


@app.post("/generate-pdf")
async def generate_pdf(request: GeneratePDFRequest) -> Response:
    try:
        pdf_bytes = generate_pdf_bytes(request.letter_markdown, request.constituency_name, request.mp_name)
    except Exception as exc:  # pragma: no cover - PDF backend specific
        _log_event(
            "generate_pdf_failed",
            master_incident_id="n/a",
            department_routed_to="n/a",
            llm_latency_ms=0,
            success=False,
            error=str(exc),
        )
        raise HTTPException(status_code=500, detail="Unable to generate PDF from the provided markdown.") from exc

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    _log_event(
        "generate_pdf_success",
        master_incident_id="n/a",
        department_routed_to="n/a",
        llm_latency_ms=0,
        success=True,
        pdf_bytes=len(pdf_bytes),
    )
    headers = {"Content-Disposition": f'attachment; filename="grievance_letter_{timestamp}.pdf"'}
    return StreamingResponse(BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
