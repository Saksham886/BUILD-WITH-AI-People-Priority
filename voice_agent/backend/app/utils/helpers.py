"""
General-purpose utility helpers.
"""

import uuid
import os
from pathlib import Path

import aiofiles

from app.config import get_settings
from app.utils.logger import logger

settings = get_settings()


async def save_temp_file(data: bytes, suffix: str = ".webm") -> str:
    """
    Save raw bytes to a temp file in TEMP_AUDIO_DIR.
    Returns the absolute file path.
    """
    temp_dir = Path(settings.temp_audio_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{suffix}"
    file_path = temp_dir / filename

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(data)

    logger.debug(f"Saved temp file: {file_path}")
    return str(file_path)


def cleanup_temp_file(file_path: str) -> None:
    """Delete a temporary file if it exists."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"Cleaned up temp file: {file_path}")
    except Exception as exc:
        logger.warning(f"Failed to delete temp file {file_path}: {exc}")


def build_llm_prompt(transcript: str, detected_lang: str) -> str:
    """
    Load the prompt template and inject transcript + language.
    """
    prompt_path = Path(__file__).parent.parent / "prompts" / "canonical_problem.txt"
    template = prompt_path.read_text(encoding="utf-8")

    # Inject the transcript into the template
    prompt = template.replace("{{TRANSCRIPT}}", transcript)
    prompt = prompt.replace("{{LANGUAGE}}", detected_lang)
    return prompt


def get_file_extension(filename: str) -> str:
    """Return lowercase file extension including dot, e.g. '.webm'."""
    return Path(filename).suffix.lower()
