"""DBSCAN clustering of grievance embeddings + priority scoring."""
from collections import Counter

import numpy as np
from sklearn.cluster import DBSCAN

from .config import get_settings
from .models import URGENCY_MULTIPLIER, GrievanceOut, MasterIncident, Urgency

# Severity ordering used to pick a cluster's dominant urgency.
_SEVERITY_RANK = {Urgency.high.value: 3, Urgency.medium.value: 2, Urgency.low.value: 1}


def _dominant_urgency(urgencies: list[str]) -> str:
    """Highest severity present in the cluster (a single 'High' escalates it)."""
    return max(urgencies, key=lambda u: _SEVERITY_RANK.get(u, 0))


def _mode(values: list[str]) -> str:
    return Counter(values).most_common(1)[0][0]


def _representative_index(vectors: np.ndarray) -> int:
    """Index of the member closest to the cluster centroid (medoid-ish)."""
    centroid = vectors.mean(axis=0)
    # Vectors are L2-normalized; cosine similarity == dot product.
    sims = vectors @ centroid
    return int(np.argmax(sims))


def build_master_incidents(
    grievances: list[GrievanceOut], vectors: np.ndarray
) -> list[MasterIncident]:
    """Cluster grievances into Master Incidents ranked by priority score."""
    if not grievances:
        return []

    settings = get_settings()
    labels = DBSCAN(
        eps=settings.dbscan_eps,
        min_samples=settings.dbscan_min_samples,
        metric="cosine",
    ).fit_predict(vectors)

    # Group member row-indexes by DBSCAN label. Noise (-1) becomes singletons.
    clusters: dict[int, list[int]] = {}
    next_noise_id = int(labels.max()) + 1 if len(labels) else 0
    for row_idx, label in enumerate(labels):
        key = int(label)
        if key == -1:
            key = next_noise_id
            next_noise_id += 1
        clusters.setdefault(key, []).append(row_idx)

    incidents: list[MasterIncident] = []
    for cluster_id, member_idxs in clusters.items():
        members = [grievances[i] for i in member_idxs]
        member_vectors = vectors[member_idxs]

        urgency = _dominant_urgency([m.urgency.value for m in members])
        count = len(members)
        priority = count * URGENCY_MULTIPLIER[urgency]
        rep = members[_representative_index(member_vectors)]

        incidents.append(
            MasterIncident(
                cluster_id=cluster_id,
                title=rep.summary,
                category=_mode([m.category for m in members]),
                urgency=urgency,
                location=_mode([m.location for m in members]),
                count=count,
                priority_score=priority,
                member_ids=[m.id for m in members],
                member_summaries=[m.summary for m in members],
            )
        )

    incidents.sort(key=lambda i: (i.priority_score, i.count), reverse=True)
    # Renumber cluster ids to a stable 1..N by priority for a clean UI.
    for rank, incident in enumerate(incidents, start=1):
        incident.cluster_id = rank
    return incidents
