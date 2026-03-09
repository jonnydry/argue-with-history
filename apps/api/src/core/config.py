from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

_API_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _API_DIR / ".env"


class Settings(BaseSettings):
    grok_api_key: str = Field(..., min_length=1)
    grok_base_url: str = "https://api.x.ai/v1"
    frontend_url: str = "http://localhost:5000"
    openai_api_key: str = ""

    environment: str = "development"
    allowed_origins: str = ""

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else None
        env_file_encoding = "utf-8"

    def get_allowed_origins(self) -> list[str]:
        """Return the full list of CORS-allowed origins."""
        origins: list[str] = [self.frontend_url]
        if "http://localhost:5000" not in origins:
            origins.append("http://localhost:5000")
        if "http://localhost:3000" not in origins:
            origins.append("http://localhost:3000")
        replit_domain = os.environ.get("REPLIT_DOMAINS", "")
        if replit_domain:
            for domain in replit_domain.split(","):
                d = domain.strip()
                if d:
                    https_origin = f"https://{d}"
                    if https_origin not in origins:
                        origins.append(https_origin)
        replit_dev_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
        if replit_dev_domain:
            dev_origin = f"https://{replit_dev_domain}"
            if dev_origin not in origins:
                origins.append(dev_origin)
        for raw in self.allowed_origins.split(","):
            origin = raw.strip()
            if origin and origin not in origins:
                origins.append(origin)
        return origins


@lru_cache()
def get_settings() -> Settings:
    return Settings()
