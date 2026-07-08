from enum import Enum

from pydantic import BaseModel, Field


class UrgencyLevel(str, Enum):
    High = "High"
    Medium = "Medium"
    Low = "Low"


class AggregatedDetail(BaseModel):
    summary: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    urgency: UrgencyLevel


class MasterIncident(BaseModel):
    master_incident_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    total_complaints_count: int = Field(..., ge=1)
    priority_score: float
    aggregated_details: list[AggregatedDetail]


class GenerateLetterResponse(BaseModel):
    master_incident_id: str
    department_routed_to: str
    letter_markdown: str
    generated_at: str


class GeneratePDFRequest(BaseModel):
    letter_markdown: str = Field(..., min_length=1)
    constituency_name: str = Field(..., min_length=1)
    mp_name: str = Field(..., min_length=1)


class HealthResponse(BaseModel):
    status: str
    llm_provider: str
