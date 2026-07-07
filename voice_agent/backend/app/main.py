"""
FastAPI application factory.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.utils.logger import logger, setup_logger
from app.services.speech import load_whisper_model
from app.routes import upload, health

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # ---- STARTUP ----
    setup_logger()
    logger.info("=" * 60)
    logger.info("AI Civic Intelligence Platform — Stage 1 Starting")
    logger.info(f"Gemini model: {settings.gemini_model}")
    logger.info(f"Whisper: {settings.whisper_model_size} | Device: {settings.whisper_device}")
    logger.info("=" * 60)

    # Create temp audio directory
    Path(settings.temp_audio_dir).mkdir(parents=True, exist_ok=True)

    # Load Whisper model into memory
    try:
        load_whisper_model()
    except Exception as exc:
        logger.error(f"Failed to load Whisper model: {exc}")
        logger.warning("Voice transcription will be unavailable until Whisper loads successfully.")

    yield  # Application is running

    # ---- SHUTDOWN ----
    logger.info("Shutting down AI Civic Intelligence Platform.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="AI Civic Intelligence Platform",
        description=(
            "Stage 1: Multilingual Citizen Grievance Normalization. "
            "Accepts voice/text complaints in any Indian language and returns "
            "a standardized canonical problem statement."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS — allow frontend dev server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health.router)
    app.include_router(upload.router)

    return app


app = create_app()
