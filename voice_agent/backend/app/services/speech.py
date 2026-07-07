"""
Speech-to-Text service using Faster Whisper.
The model is loaded once at startup and reused across requests.
"""

from pathlib import Path
from faster_whisper import WhisperModel

from app.config import get_settings
from app.utils.logger import logger

settings = get_settings()

# Module-level singleton — loaded once when the app starts
_whisper_model: WhisperModel | None = None


def load_whisper_model() -> None:
    """
    Initialize the Faster Whisper model.
    Called during FastAPI startup event.
    """
    global _whisper_model
    logger.info(
        f"Loading Whisper model: size={settings.whisper_model_size}, "
        f"device={settings.whisper_device}, compute_type={settings.whisper_compute_type}"
    )
    _whisper_model = WhisperModel(
        settings.whisper_model_size,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute_type,
    )
    logger.info("Whisper model loaded successfully.")


def is_whisper_loaded() -> bool:
    return _whisper_model is not None


def transcribe(audio_path: str, task: str = "transcribe") -> tuple[str, str]:
    """
    Transcribe or translate an audio file to text.

    Args:
        audio_path: Absolute path to the audio file.
        task: Whisper task, either "transcribe" or "translate".

    Returns:
        Tuple of (transcribed_text, whisper_detected_language_code).
        The language code comes directly from Whisper — much more reliable
        than running langdetect on Indic-language transcripts.

    Raises:
        RuntimeError: If Whisper model is not loaded.
        FileNotFoundError: If the audio file does not exist.
    """
    if _whisper_model is None:
        raise RuntimeError("Whisper model is not loaded. Call load_whisper_model() first.")

    if not Path(audio_path).exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    logger.info(f"Transcribing audio (task={task}): {audio_path}")

    try:
        segments, info = _whisper_model.transcribe(
            audio_path,
            beam_size=5,
            language=None,           # Auto-detect language
            task=task,               # Use passed task (transcribe or translate)
            vad_filter=True,         # Voice Activity Detection — skip silence
            vad_parameters={"min_silence_duration_ms": 500},
        )

        transcript = " ".join(segment.text.strip() for segment in segments)
        detected_lang = info.language  # ISO 639-1 code from Whisper (most reliable for Indic)

    except ValueError as exc:
        # Faster Whisper raises "max() arg is an empty sequence" when the
        # audio is completely silent or too short for VAD to find any speech.
        if "empty sequence" in str(exc) or "max()" in str(exc):
            raise ValueError(
                "No speech detected in the recording. "
                "Please record for at least 2 seconds and speak clearly."
            ) from exc
        raise

    if not transcript.strip():
        raise ValueError(
            "Transcription produced empty text. "
            "Please speak clearly into your microphone and try again."
        )

    logger.info(
        f"Transcription complete. Whisper detected language: {detected_lang}. "
        f"Text: {transcript[:100]}..."
    )
    return transcript.strip(), detected_lang
