from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .core.config import get_settings
from .core.limiter import limiter
from .routers import figures, debate
from .services.persistence import debate_persistence
from .services.grok_service import grok_service

settings = get_settings()
_is_production = settings.environment == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await debate_persistence.cleanup_old(max_age_hours=24)
    yield
    await grok_service.close()


app = FastAPI(
    title="Argue With History API",
    description="Debate simulator: You vs. Historical Figures",
    version="0.1.0",
    lifespan=lifespan,
    # Disable interactive docs in production
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)

app.include_router(figures.router)
app.include_router(debate.router)


@app.get("/")
async def root():
    return {"message": "Argue With History API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
