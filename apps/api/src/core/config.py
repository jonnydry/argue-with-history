from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache

# Always load .env from apps/api/ so keys are found regardless of CWD
_API_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _API_DIR / ".env"


class Settings(BaseSettings):
    grok_api_key: str = Field(..., min_length=1)
    grok_base_url: str = "https://api.x.ai/v1"
    frontend_url: str = "http://localhost:3000"
    openai_api_key: str = ""

    # Deployment controls
    environment: str = "development"  # "production" | "development"
    allowed_origins: str = ""         # comma-separated extra allowed origins

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"

    def get_allowed_origins(self) -> list[str]:
        """Return the full list of CORS-allowed origins."""
        origins: list[str] = [self.frontend_url]
        if "http://localhost:3000" not in origins:
            origins.append("http://localhost:3000")
        for raw in self.allowed_origins.split(","):
            origin = raw.strip()
            if origin and origin not in origins:
                origins.append(origin)
        return origins


@lru_cache()
def get_settings() -> Settings:
    return Settings()
