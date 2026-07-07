"""Pydantic schemas for the Stage 2 aggregation API."""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Urgency(str, Enum):
    high = "High"
    medium = "Medium"
    low = "Low"


# Numeric multiplier applied to the complaint count for the priority score.
URGENCY_MULTIPLIER: dict[str, int] = {
    Urgency.high.value: 3,
    Urgency.medium.value: 2,
    Urgency.low.value: 1,
}


class GrievanceIn(BaseModel):
    """A single structured grievance produced by Stage 1 (ingestion)."""

    summary: str = Field(..., min_length=1, description="Text that gets embedded.")
    category: str = Field(default="Uncategorized", description="e.g. 'Water Supply'.")
    urgency: Urgency = Field(default=Urgency.medium)
    location: str = Field(default="Unknown")
    language: Optional[str] = Field(default=None)
    transcript: Optional[str] = Field(default=None)


class GrievanceOut(BaseModel):
    id: int
    summary: str
    category: str
    urgency: Urgency
    location: str
    language: Optional[str] = None
    transcript: Optional[str] = None
    created_at: datetime


class MasterIncident(BaseModel):
    """A cluster of semantically-similar grievances collapsed into one incident."""

    cluster_id: int
    title: str = Field(..., description="Representative summary (closest to centroid).")
    category: str
    urgency: Urgency = Field(..., description="Highest severity present in the cluster.")
    location: str
    count: int = Field(..., description="Number of citizen complaints in this cluster.")
    priority_score: int = Field(..., description="count x urgency multiplier.")
    member_ids: list[int]
    member_summaries: list[str]
