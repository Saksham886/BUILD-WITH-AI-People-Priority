"""Stage 2: Aggregation — FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .embeddings import warm_up
from .routes import clusters, grievances


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    warm_up()  # load the embedding model up front so the first request is fast
    yield


app = FastAPI(
    title="Stage 2: Aggregation — Semantic Text Clustering & Counting",
    description=(
        "Takes structured grievance JSON from Stage 1, embeds each summary, "
        "clusters semantically-similar complaints into Master Incidents with "
        "DBSCAN, and scores priority = count x urgency multiplier."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(grievances.router)
app.include_router(clusters.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
