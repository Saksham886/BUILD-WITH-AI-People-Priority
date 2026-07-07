"""
Pydantic response schemas.
"""

from typing import Any, Optional

from pydantic import BaseModel


class CanonicalResponse(BaseModel):
    canonical_problem: str
    translated_complaint: str = ""
    location: Optional[Any] = None  # {lat, lon, display} or None if user denied permission


class HealthResponse(BaseModel):
    status: str
    gemini_reachable: bool
    whisper_loaded: bool
