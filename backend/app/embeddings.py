"""Local sentence-transformers embedder (lazy singleton)."""
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from .config import get_settings


@lru_cache
def _get_model() -> SentenceTransformer:
    """Load the embedding model once. First call downloads ~90MB (then cached)."""
    return SentenceTransformer(get_settings().model_name)


def embed(texts: list[str]) -> np.ndarray:
    """Encode texts into L2-normalized float32 vectors (cosine-ready)."""
    model = _get_model()
    vectors = model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return vectors.astype(np.float32)


def embed_one(text: str) -> np.ndarray:
    return embed([text])[0]


def warm_up() -> None:
    """Trigger model load eagerly (used at startup so first request is fast)."""
    _get_model()
