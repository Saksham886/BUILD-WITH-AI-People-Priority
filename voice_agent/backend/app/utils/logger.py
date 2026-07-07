"""
Structured logger using Loguru.
Import `logger` from this module throughout the app.
"""

import sys
from pathlib import Path
from loguru import logger as _logger
from app.config import get_settings


def setup_logger() -> None:
    """Configure loguru with console + rotating file output."""
    settings = get_settings()

    # Remove default handler
    _logger.remove()

    log_level = settings.log_level.upper()

    # Console handler — colorized, human-readable
    _logger.add(
        sys.stdout,
        level=log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    # File handler — JSON-style, with rotation
    log_path = Path(settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    _logger.add(
        str(log_path),
        level=log_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        rotation="10 MB",
        retention="7 days",
        compression="zip",
    )


# Re-export so callers do: from app.utils.logger import logger
logger = _logger
