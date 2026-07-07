"""
Pipeline orchestrator — the ONLY module that chains services together.
Routes call this module; they contain zero AI logic.
"""

from fastapi import UploadFile

from app.services import speech, language, llm, normalize
from app.utils.helpers import save_temp_file, cleanup_temp_file, build_llm_prompt, get_file_extension
from app.utils.logger import logger

SUPPORTED_AUDIO_EXTENSIONS = {".webm", ".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".flac"}


async def run_voice_pipeline(file: UploadFile, location: dict | None = None) -> dict:
    """
    Full pipeline for voice input:
    1. Validate & save audio file
    2. Transcribe with Faster Whisper
    3. Detect language
    4. Build LLM prompt
    5. Call Ollama
    6. Parse & validate JSON response
    7. Attach location metadata (if provided)

    Args:
        file: Uploaded audio file from FastAPI.
        location: Optional dict with keys lat, lon, display.

    Returns:
        dict: {"canonical_problem": "...", "location": {...}}

    Raises:
        ValueError: For unsupported file types or empty transcriptions.
        RuntimeError: For Whisper or LLM failures.
    """
    # Step 1: Validate file type
    ext = get_file_extension(file.filename or "audio.webm")
    if ext not in SUPPORTED_AUDIO_EXTENSIONS:
        raise ValueError(
            f"Unsupported audio format: '{ext}'. "
            f"Supported formats: {', '.join(SUPPORTED_AUDIO_EXTENSIONS)}"
        )

    logger.info(f"Voice pipeline started. File: {file.filename}, Extension: {ext}")

    # Step 2: Save to temp file
    audio_bytes = await file.read()
    if not audio_bytes:
        raise ValueError("Uploaded audio file is empty.")

    temp_path = await save_temp_file(audio_bytes, suffix=ext)

    try:
        # Step 3: Speech-to-Text + Translation + Language Detection
        # NOTE: We get the language and translated English text directly from Whisper here.
        # Whisper's built-in translation is highly accurate and translates non-English audio
        # directly into English text.
        logger.info("Step: Speech-to-Text + Translation + Language Detection")
        transcript, whisper_lang = speech.transcribe(temp_path, task="translate")

        if not transcript.strip():
            raise ValueError("Transcription produced empty text. Please speak clearly and try again.")

        logger.info(f"Whisper language: {whisper_lang} | Transcript (first 100): {transcript[:100]}")

        # Step 4: Build prompt and call LLM
        # Pass Whisper's detected language — skipping langdetect for voice
        logger.info("Step: LLM Normalization")
        prompt = build_llm_prompt(transcript, whisper_lang)
        raw_response = await llm.call_ollama(prompt)

        # Step 5: Parse & validate JSON
        logger.info("Step: JSON Validation")
        result = normalize.parse_canonical(raw_response)

        # Step 6: Attach location — bake it into canonical_problem for DBSCAN
        result["location"] = location  # None if not provided
        if location:
            loc_label = location["display"]
            result["canonical_problem"] = f"{result['canonical_problem']} in {loc_label}"
            logger.info(f"Location baked into canonical_problem: {loc_label!r}")

        logger.info(f"Voice pipeline complete: {result}")
        return result

    finally:
        # Always clean up temp file, even on error
        cleanup_temp_file(temp_path)


async def run_text_pipeline(text: str, location: dict | None = None) -> dict:
    """
    Full pipeline for text input:
    1. Detect language
    2. Build LLM prompt
    3. Call Ollama
    4. Parse & validate JSON response
    5. Attach location metadata (if provided)

    Args:
        text: Raw complaint text (any Indian language).
        location: Optional dict with keys lat, lon, display.

    Returns:
        dict: {"canonical_problem": "...", "location": {...}}
    """
    logger.info(f"Text pipeline started. Input (first 100 chars): {text[:100]}")

    # Step 1: Language detection
    logger.info("Step: Language Detection")
    detected_lang = language.detect_language(text)

    # Step 2: Build prompt and call LLM
    logger.info("Step: LLM Normalization")
    prompt = build_llm_prompt(text, detected_lang)
    raw_response = await llm.call_ollama(prompt)

    # Step 3: Parse & validate JSON
    logger.info("Step: JSON Validation")
    result = normalize.parse_canonical(raw_response)

    # Step 4: Attach location — bake it into canonical_problem for DBSCAN
    result["location"] = location  # None if not provided
    if location:
        loc_label = location["display"]
        result["canonical_problem"] = f"{result['canonical_problem']} in {loc_label}"
        logger.info(f"Location baked into canonical_problem: {loc_label!r}")

    logger.info(f"Text pipeline complete: {result}")
    return result
