"""Ingestion endpoints: add grievances, load sample data, list, reset."""
from typing import Union

from fastapi import APIRouter

from .. import database
from ..embeddings import embed
from ..models import GrievanceIn, GrievanceOut
from ..seed import SAMPLE_GRIEVANCES

router = APIRouter(tags=["grievances"])


def _ingest_many(items: list[GrievanceIn]) -> list[GrievanceOut]:
    """Embed a batch in one pass, then persist each row."""
    vectors = embed([g.summary for g in items])
    return [
        database.insert_grievance(g, vec) for g, vec in zip(items, vectors)
    ]


@router.post("/ingest", response_model=list[GrievanceOut])
def ingest(payload: Union[GrievanceIn, list[GrievanceIn]]) -> list[GrievanceOut]:
    """Accept a single grievance or a list; embed and store them."""
    items = payload if isinstance(payload, list) else [payload]
    return _ingest_many(items)


@router.post("/ingest/seed", response_model=list[GrievanceOut])
def ingest_seed() -> list[GrievanceOut]:
    """Bulk-load the built-in sample grievances for the demo."""
    return _ingest_many(SAMPLE_GRIEVANCES)


@router.get("/grievances", response_model=list[GrievanceOut])
def get_grievances() -> list[GrievanceOut]:
    return database.list_grievances()


@router.delete("/reset")
def reset() -> dict:
    deleted = database.reset_db()
    return {"deleted": deleted}
