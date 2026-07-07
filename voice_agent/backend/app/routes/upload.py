"""
Upload routes — voice and text complaint endpoints.
Zero AI logic here. All processing is delegated to pipeline.py.
"""

from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, status
from fastapi.responses import JSONResponse
from google.api_core.exceptions import ResourceExhausted

from app.schemas.request import TextRequest
from app.schemas.response import CanonicalResponse
from app.services import pipeline
from app.utils.logger import logger

router = APIRouter(tags=["Complaints"])


@router.post(
    "/voice",
    summary="Process voice complaint",
    description="Upload an audio file containing a citizen complaint in any Indian language.",
)
async def process_voice(
    file: UploadFile = File(..., description="Audio file (.webm, .mp3, .wav, .ogg, .m4a)"),
    lat: Optional[float] = Query(None, description="Latitude from browser Geolocation API"),
    lon: Optional[float] = Query(None, description="Longitude from browser Geolocation API"),
    location_display: Optional[str] = Query(None, description="Human-readable location string"),
) -> JSONResponse:
    """
    Accept a voice recording and return a canonical problem statement.
    """
    logger.info(f"POST /voice — filename={file.filename}, content_type={file.content_type}, location={location_display!r}")

    location = None
    if lat is not None and lon is not None:
        location = {"lat": lat, "lon": lon, "display": location_display or f"{lat:.5f},{lon:.5f}"}

    try:
        result = await pipeline.run_voice_pipeline(file, location=location)
        return JSONResponse(content=result, status_code=status.HTTP_200_OK)

    except ResourceExhausted as exc:
        logger.warning(f"Gemini quota exceeded in /voice: {exc}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service quota exceeded. Please wait a moment and try again.",
            headers={"Retry-After": "30"},
        )

    except ValueError as exc:
        logger.warning(f"Validation error in /voice: {exc}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    except FileNotFoundError as exc:
        logger.error(f"File error in /voice: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    except RuntimeError as exc:
        logger.error(f"Runtime error in /voice: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    except Exception as exc:
        logger.exception(f"Unexpected error in /voice: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )


@router.post(
    "/text",
    summary="Process text complaint",
    description="Submit a text complaint in any Indian language for normalization.",
)
async def process_text(
    request: TextRequest,
    lat: Optional[float] = Query(None, description="Latitude from browser Geolocation API"),
    lon: Optional[float] = Query(None, description="Longitude from browser Geolocation API"),
    location_display: Optional[str] = Query(None, description="Human-readable location string"),
) -> JSONResponse:
    """
    Accept a text complaint and return a canonical problem statement.
    """
    logger.info(f"POST /text — text length={len(request.text)}, location={location_display!r}")

    location = None
    if lat is not None and lon is not None:
        location = {"lat": lat, "lon": lon, "display": location_display or f"{lat:.5f},{lon:.5f}"}

    try:
        result = await pipeline.run_text_pipeline(request.text, location=location)
        return JSONResponse(content=result, status_code=status.HTTP_200_OK)

    except ResourceExhausted as exc:
        logger.warning(f"Gemini quota exceeded in /text: {exc}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service quota exceeded. Please wait a moment and try again.",
            headers={"Retry-After": "30"},
        )

    except ValueError as exc:
        logger.warning(f"Validation error in /text: {exc}")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    except Exception as exc:
        logger.exception(f"Unexpected error in /text: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )
