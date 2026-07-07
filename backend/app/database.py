"""SQLite persistence layer for grievances and their cached embeddings."""
import sqlite3
from datetime import datetime, timezone

import numpy as np

from .config import get_settings
from .models import GrievanceIn, GrievanceOut

_SCHEMA = """
CREATE TABLE IF NOT EXISTS grievances (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    summary    TEXT    NOT NULL,
    category   TEXT    NOT NULL DEFAULT 'Uncategorized',
    urgency    TEXT    NOT NULL DEFAULT 'Medium',
    location   TEXT    NOT NULL DEFAULT 'Unknown',
    language   TEXT,
    transcript TEXT,
    embedding  BLOB    NOT NULL,
    created_at TEXT    NOT NULL
);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(get_settings().db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(_SCHEMA)
        conn.commit()


def _row_to_out(row: sqlite3.Row) -> GrievanceOut:
    return GrievanceOut(
        id=row["id"],
        summary=row["summary"],
        category=row["category"],
        urgency=row["urgency"],
        location=row["location"],
        language=row["language"],
        transcript=row["transcript"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


def insert_grievance(g: GrievanceIn, embedding: np.ndarray) -> GrievanceOut:
    """Persist one grievance with its precomputed (normalized) embedding."""
    created_at = datetime.now(timezone.utc).isoformat()
    blob = embedding.astype(np.float32).tobytes()
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO grievances
                (summary, category, urgency, location, language, transcript,
                 embedding, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                g.summary,
                g.category,
                g.urgency.value,
                g.location,
                g.language,
                g.transcript,
                blob,
                created_at,
            ),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM grievances WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return _row_to_out(row)


def list_grievances() -> list[GrievanceOut]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM grievances ORDER BY id ASC"
        ).fetchall()
    return [_row_to_out(r) for r in rows]


def load_vectors() -> tuple[list[GrievanceOut], np.ndarray]:
    """Return all grievances plus a stacked (N, dim) embedding matrix."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM grievances ORDER BY id ASC"
        ).fetchall()
    grievances = [_row_to_out(r) for r in rows]
    if not rows:
        return grievances, np.empty((0, 0), dtype=np.float32)
    vectors = np.stack(
        [np.frombuffer(r["embedding"], dtype=np.float32) for r in rows]
    )
    return grievances, vectors


def reset_db() -> int:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM grievances")
        conn.commit()
    return cur.rowcount
