"""
JSON normalization and validation service.
Parses raw LLM output into a validated canonical problem dict.
"""

import json
import re

from app.utils.logger import logger


def parse_canonical(raw: str) -> dict:
    """
    Parse and validate LLM output into canonical problem JSON.

    Handles edge cases:
    - LLM wraps response in markdown code fences (```json ... ```)
    - LLM includes extra whitespace or newlines
    - LLM returns invalid JSON

    Args:
        raw: Raw string response from the LLM.

    Returns:
        dict with key "canonical_problem".

    Raises:
        ValueError: If JSON is invalid or key is missing.
    """
    # Strip markdown code fences if present
    cleaned = _strip_code_fences(raw)

    # Attempt JSON parse
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error(f"JSON parse failed. Raw LLM output: {raw!r}. Error: {exc}")
        raise ValueError(f"LLM returned invalid JSON: {exc}") from exc

    # Validate required key
    if "canonical_problem" not in parsed:
        logger.error(f"Missing 'canonical_problem' key. Parsed: {parsed}")
        raise ValueError("LLM response missing 'canonical_problem' field.")

    canonical = str(parsed["canonical_problem"]).strip()
    if not canonical:
        raise ValueError("canonical_problem value is empty.")

    # Get translated complaint (optional fallback to empty string)
    translated = str(parsed.get("translated_complaint", "")).strip()

    logger.info(f"Parsed LLM response - Canonical: {canonical!r}, Translation: {translated!r}")
    return {
        "canonical_problem": canonical,
        "translated_complaint": translated,
    }


def _strip_code_fences(text: str) -> str:
    """Remove markdown code blocks (```json ... ```) from text."""
    # Match ```json ... ``` or ``` ... ```
    pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(pattern, text)
    if match:
        return match.group(1).strip()
    return text.strip()
