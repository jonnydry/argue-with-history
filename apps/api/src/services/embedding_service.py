"""OpenAI embeddings for semantic retrieval."""
import asyncio

import numpy as np
from openai import OpenAI
from ..core.config import get_settings


class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        settings = get_settings()
        key = getattr(settings, "openai_api_key", "") or ""
        self._client = OpenAI(api_key=key) if key else None

    def embed(self, text: str) -> list[float]:
        """Get embedding for a single text (sync). Returns empty list if disabled."""
        if not self._client:
            return []
        resp = self._client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],
        )
        return resp.data[0].embedding

    async def embed_async(self, text: str) -> list[float]:
        """Non-blocking wrapper around embed() — runs in a thread."""
        return await asyncio.to_thread(self.embed, text)

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        va = np.asarray(a, dtype=np.float64)
        vb = np.asarray(b, dtype=np.float64)
        norm_a = np.linalg.norm(va)
        norm_b = np.linalg.norm(vb)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return float(np.dot(va, vb) / (norm_a * norm_b))


embedding_service = EmbeddingService()
