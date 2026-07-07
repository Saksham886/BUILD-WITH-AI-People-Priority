"""
Health check route.
"""

from fastapi import APIRouter
from app.services.llm import check_gemini_reachable
from app.services.speech import is_whisper_loaded
from app.schemas.response import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Returns service health status including Gemini and Whisper availability.
    """
    gemini_ok = await check_gemini_reachable()
    whisper_ok = is_whisper_loaded()

    return HealthResponse(
        status="healthy",
        gemini_reachable=gemini_ok,
        whisper_loaded=whisper_ok,
    )
