"""Aggregation endpoint: cluster grievances into ranked Master Incidents."""
from fastapi import APIRouter

from .. import database
from ..clustering import build_master_incidents
from ..models import MasterIncident

router = APIRouter(tags=["aggregation"])


@router.get("/get-clusters", response_model=list[MasterIncident])
def get_clusters() -> list[MasterIncident]:
    """Semantic-cluster all stored grievances and return Master Incidents,
    ranked by priority score (count x urgency multiplier)."""
    grievances, vectors = database.load_vectors()
    return build_master_incidents(grievances, vectors)
