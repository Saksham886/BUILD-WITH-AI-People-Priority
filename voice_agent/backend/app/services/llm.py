"""
LLM service — communicates with Google Gemini API.
"""

import asyncio

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

from app.config import get_settings
from app.utils.logger import logger

settings = get_settings()

# Configure the Gemini client once at module load
genai.configure(api_key=settings.gemini_api_key)

_model = genai.GenerativeModel(
    model_name=settings.gemini_model,
    generation_config=genai.types.GenerationConfig(
        temperature=0.1,           # Low temperature for consistent, deterministic output
        top_p=0.9,
        max_output_tokens=512,     # Prevent truncation of translation + classification output
        response_mime_type="application/json",  # Enforce JSON output
    ),
)

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 2.0  # seconds; doubles each attempt (2 → 4 → 8)


async def call_gemini(prompt: str) -> str:
    """
    Send a prompt to Gemini and return the raw response text (JSON string).

    Retries up to _MAX_RETRIES times with exponential backoff on quota errors (429).

    Args:
        prompt: Full prompt string to send to the model.

    Returns:
        Raw JSON string response from the model.

    Raises:
        ResourceExhausted: If quota is still exceeded after all retries.
        RuntimeError: For other unexpected Gemini API errors.
    """
    logger.info(f"Calling Gemini model: {settings.gemini_model}")

    last_exc: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = await _model.generate_content_async(prompt)
            raw_text = response.text.strip()
            logger.debug(f"Gemini raw response: {raw_text[:200]}")
            return raw_text

        except ResourceExhausted as exc:
            last_exc = exc
            delay = _RETRY_BASE_DELAY * (2 ** (attempt - 1))
            logger.warning(
                f"Gemini quota exceeded (attempt {attempt}/{_MAX_RETRIES}). "
                f"Retrying in {delay:.0f}s…"
            )
            if attempt < _MAX_RETRIES:
                await asyncio.sleep(delay)

    # All retries exhausted — bubble up so the route can return HTTP 429
    raise last_exc  # type: ignore[misc]


# Keep backward-compatible alias so pipeline.py works without changes
call_ollama = call_gemini


async def check_gemini_reachable() -> bool:
    """Ping Gemini to check if the API key is valid and the service is reachable."""
    try:
        test_response = await _model.generate_content_async("ping")
        return bool(test_response.text)
    except Exception:
        return False
