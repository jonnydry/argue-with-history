# Argue With History

## Overview

Argue With History is a debate simulator where users argue against historical philosophical figures (Machiavelli, Socrates, Epictetus, etc.) using their actual writings as source material. The app uses AI (Grok/xAI) to generate in-character responses grounded in real texts, with semantic retrieval (OpenAI embeddings) to find relevant passages from each figure's works.

The project is a monorepo with two apps:
- **Frontend** (`apps/web`): Next.js 16 React app with Tailwind CSS and shadcn/ui
- **Backend** (`apps/api`): FastAPI Python API that handles debate logic, text retrieval, and AI generation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
```
apps/
  api/          — Python FastAPI backend
  web/          — Next.js TypeScript frontend
data/
  figures/      — Pre-processed texts and embeddings for ~32 historical figures
  debates.db    — SQLite database for debate persistence (created at runtime)
scripts/        — Data processing and embedding precomputation scripts
```

### Backend (FastAPI - `apps/api/`)

- **Framework**: FastAPI with Pydantic for validation and settings management
- **Entry point**: `apps/api/src/main.py` — creates the FastAPI app with CORS, GZip, and rate limiting middleware
- **Configuration**: `apps/api/src/core/config.py` — uses `pydantic-settings` to load from `.env` file in `apps/api/`. Key settings: `GROK_API_KEY`, `OPENAI_API_KEY`, `FRONTEND_URL`, `ENVIRONMENT`
- **Routers**:
  - `figures` — Lists available historical figures and their debate topics, with caching headers
  - `debate` — Handles debate lifecycle: start, submit turns, end. Uses per-debate async locks to prevent race conditions
- **Services**:
  - `grok_service` — Calls xAI's Grok API (OpenAI-compatible endpoint at `api.x.ai/v1`) for generating in-character AI responses
  - `retrieval_service` — Loads pre-processed text data from JSON files in `data/figures/`, performs topic-based and semantic retrieval to find relevant passages
  - `embedding_service` — Uses OpenAI's `text-embedding-3-small` model for semantic search; falls back gracefully if no API key is set
  - `prompts` — Contains detailed system prompts for each historical figure defining their personality, debate style, and rules
  - `persistence` — SQLite-based debate state persistence in `data/debates.db` with async locking and 24-hour cleanup
- **Rate limiting**: Uses `slowapi` library with IP-based limiting (e.g., 10 starts/minute)
- **Production mode**: When `ENVIRONMENT=production`, docs/redoc/openapi endpoints are disabled

### Frontend (Next.js - `apps/web/`)

- **Framework**: Next.js 16 with App Router, TypeScript, React 19
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (new-york style), tw-animate-css
- **State management**: Zustand with `persist` middleware (localStorage) for debate state, figure selection, and settings
- **Pages**:
  - `/` — Home page with figure grid listing all available philosophers
  - `/figures` — Figure selection and topic picker with preview dialog
  - `/debate` — Active debate interface with turn-by-turn interaction
- **API communication**: `src/lib/api.ts` — typed fetch wrapper that calls the backend. API base URL configured via `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8000`)
- **Progression tracking**: `src/lib/progression.ts` — localStorage-based tracking of completed debates per figure/topic
- **Animation**: Framer Motion for UI transitions

### Data Layer

- **Historical texts**: Pre-processed from Project Gutenberg into structured JSON files under `data/figures/{figure_name}/`
  - `index.json` — Sections/chapters with themes and text excerpts
  - `embeddings.json` — Pre-computed OpenAI embeddings for semantic search
  - Figure-specific files (e.g., `the_prince.json`, `dialogues.json`)
- **Text retrieval**: Combines keyword/topic matching with semantic similarity (cosine similarity on pre-computed embeddings) to find relevant passages for debate context
- **Debate persistence**: SQLite database at `data/debates.db` — stores serialized debate state as JSON blobs

### Deployment Architecture

- **Backend**: Deployed on Railway using Nixpacks builder with gunicorn + uvicorn workers. Configuration in `railway.json`. Uses a mounted volume at `/app/data` for SQLite persistence
- **Frontend**: Deployed on Vercel with root directory set to `apps/web`
- **Python version**: 3.11 (specified in `runtime.txt`)

## External Dependencies

### AI/LLM Services
- **xAI Grok API** (`GROK_API_KEY`): Primary LLM for generating in-character debate responses. Uses OpenAI-compatible API format at `https://api.x.ai/v1`
- **OpenAI API** (`OPENAI_API_KEY`): Used for text embeddings (`text-embedding-3-small` model) to enable semantic retrieval of relevant passages. Optional — system falls back to keyword matching if unavailable

### Data Sources
- **Project Gutenberg**: Public domain philosophical texts downloaded and pre-processed into JSON. Processing scripts in `scripts/` and `data/`

### Frontend Dependencies
- **Radix UI** (via `radix-ui` package): Accessible UI primitives used by shadcn/ui components
- **Framer Motion**: Animation library
- **Zustand**: Lightweight state management with localStorage persistence

### Backend Dependencies
- **FastAPI + Uvicorn/Gunicorn**: Web framework and ASGI servers
- **httpx**: Async HTTP client for calling the Grok API
- **slowapi**: Rate limiting middleware
- **pydantic-settings**: Configuration management from environment variables
- **SQLite** (stdlib): Debate state persistence — no external database required

### Infrastructure
- **Railway**: Backend hosting with optional persistent volume for SQLite
- **Vercel**: Frontend hosting