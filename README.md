# Argue With History

Debate simulator: You vs. Historical Figures using their actual writings.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Grok API key

### Setup

1. **Clone and install dependencies:**

```bash
# Frontend
cd apps/web
npm install

# Backend
cd ../api
pip install -r requirements.txt
```

2. **Configure environment:**

```bash
# Backend
cd apps/api && cp .env.example .env
# Edit .env and add your GROK_API_KEY and OPENAI_API_KEY
```

3. **Start the servers:**

```bash
# Terminal 1 - Backend
cd apps/api
uvicorn src.main:app --reload --port 8000

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

4. **Open http://localhost:3000**

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step instructions to deploy the API (Railway) and frontend (Vercel).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  - Landing page with figure selection                       │
│  - Debate arena with real-time scoring                      │
│  - localStorage persistence                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│  - Debate orchestration                                      │
│  - Chapter/dialogue retrieval (file-based, no vector DB)    │
│  - Scoring engine (LLM-as-judge)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    AI LAYER (Grok API)                      │
│  - Historical figure personas                                │
│  - Response generation with source grounding                 │
│  - Argument scoring                                          │
└─────────────────────────────────────────────────────────────┘
```

## Historical Figures

### Machiavelli
- **Works:** The Prince (26 chapters)
- **Topics:** Fear vs Love, Power, Virtue, Promises, Generosity
- **Style:** Pragmatic, cynical, authoritative

### Socrates
- **Works:** Apology, Crito, Euthyphro, Phaedo
- **Topics:** Justice, Truth, Death, Civil Disobedience, Virtue
- **Style:** Questioning, ironic, dialectical

## API Endpoints

```
GET  /figures                  # List all figures
GET  /figures/{id}             # Get figure details
GET  /figures/{id}/topics      # Get debate topics

POST /debate/start             # Start new debate
POST /debate/turn              # Submit argument
GET  /debate/{id}              # Get debate state
POST /debate/{id}/end          # End debate
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui, Zustand |
| Backend | FastAPI, Python 3.10+ |
| AI | Grok-2 (xAI) |
| Data | Project Gutenberg texts, processed JSON |

## Project Structure

```
argue-with-history/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/           # Pages
│   │       ├── components/    # UI components
│   │       ├── lib/           # API client, types
│   │       └── stores/        # Zustand stores
│   │
│   └── api/                    # FastAPI backend
│       └── src/
│           ├── routers/       # API endpoints
│           ├── services/      # Business logic
│           ├── models/        # Data models
│           └── core/          # Config
│
├── data/
│   └── figures/
│       ├── machiavelli/       # The Prince
│       └── socrates/          # Plato's Dialogues
│
└── README.md
```

## Development

### Adding a New Historical Figure

1. Add figure data to `apps/api/src/models/figures.py`
2. Add persona prompt to `apps/api/src/services/prompts.py`
3. Download and process texts from Project Gutenberg
4. Create retrieval logic in `apps/api/src/services/retrieval_service.py`

### Customizing Personas

Edit the system prompts in `apps/api/src/services/prompts.py` to adjust:
- Core traits and debate style
- Response formatting
- What to avoid

## License

MIT

## Credits

- Historical texts from [Project Gutenberg](https://gutenberg.org)
- Built with Next.js, FastAPI, and Grok AI
