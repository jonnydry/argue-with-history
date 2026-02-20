"""OpenAI embeddings for semantic retrieval."""
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
        """Get embedding for a single text. Returns empty list if disabled."""
        if not self._client:
            return []
        resp = self._client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],
        )
        return resp.data[0].embedding

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)


embedding_service = EmbeddingService()
