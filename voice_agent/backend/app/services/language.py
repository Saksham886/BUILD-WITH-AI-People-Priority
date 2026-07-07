"""
Language detection service using langdetect.
"""

from langdetect import detect, LangDetectException

from app.utils.logger import logger

# Map ISO 639-1 codes to human-readable names for logging/debugging
LANG_NAMES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
    "te": "Telugu",
    "ta": "Tamil",
    "mr": "Marathi",
    "gu": "Gujarati",
    "bn": "Bengali",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
}


def detect_language(text: str) -> str:
    """
    Detect the language of the input text.

    Args:
        text: Input text string.

    Returns:
        ISO 639-1 language code (e.g., 'en', 'hi', 'kn').
        Falls back to 'unknown' if detection fails.
    """
    if not text or not text.strip():
        return "unknown"

    try:
        lang_code = detect(text)
        lang_name = LANG_NAMES.get(lang_code, lang_code)
        logger.info(f"Detected language: {lang_name} ({lang_code})")
        return lang_code
    except LangDetectException as exc:
        logger.warning(f"Language detection failed: {exc}. Defaulting to 'unknown'.")
        return "unknown"
