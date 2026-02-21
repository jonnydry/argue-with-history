# Argue With History

Debate simulator: You vs. Historical Figures using their actual writings. Select a philosopher, pick a topic, and argue—the AI responds in character, grounded in their works.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Grok API key (xAI)
- OpenAI API key (optional, for semantic search; falls back to keyword matching if not set)

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
# Edit .env and add your GROK_API_KEY (required)
# Add OPENAI_API_KEY for semantic retrieval (optional)
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
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                        │
│  - Landing page with animated figure carousel                     │
│  - Figures page: era filtering, two-tap selection, auto-scroll    │
│  - Debate arena with real-time scoring                           │
│  - Zustand store with persisted state                            │
└────────────────────────────┬────────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼────────────────────────────────────┐
│                    BACKEND (FastAPI)                              │
│  - Debate orchestration                                           │
│  - Semantic retrieval (OpenAI embeddings) or keyword fallback    │
│  - File-based JSON cache, no vector DB                           │
│  - GZip compression, rate limiting                                │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                    AI LAYER (xAI Grok API)                        │
│  - Model: grok-4-1-fast-non-reasoning                            │
│  - Historical figure personas                                     │
│  - Response generation with source grounding                      │
│  - Argument scoring (logic, rhetoric, historical accuracy)        │
└─────────────────────────────────────────────────────────────────┘
```

## Historical Figures

30+ philosophers and thinkers across five eras:

| Era | Figures |
|-----|---------|
| Classical | Socrates, Plato, Aristotle, Cicero, Lucretius, Seneca |
| Roman Empire | Epictetus, Marcus Aurelius |
| Renaissance / Early Modern | Machiavelli, Hobbes, Locke, Descartes, Spinoza, Leibniz |
| Enlightenment | Hume, Kant, Rousseau, Voltaire, Paine, Burke, Wollstonecraft |
| 19th–20th Century | Nietzsche, Marx, Mill, Thoreau, Douglass, Emerson, DuBois, Darwin, James, Tocqueville, Russell |

Each figure has 5 debate topics and source material drawn from public-domain texts (Project Gutenberg and similar).

## API Endpoints

```
GET  /figures                          # List all figures
GET  /figures/{id}                     # Get figure details
GET  /figures/{id}/topics              # Get debate topics
GET  /figures/{id}/topics/{tid}/preview  # Preview passages for a topic
GET  /figures/{id}/topics/{tid}/primer  # Position primer (AI-generated)

POST /debate/start                     # Start new debate
POST /debate/turn                      # Submit argument
GET  /debate/{id}                      # Get debate state
POST /debate/{id}/end                  # End debate
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Zustand |
| Backend | FastAPI, Python 3.10+ |
| AI | Grok 4 (grok-4-1-fast-non-reasoning, xAI) |
| Embeddings | OpenAI text-embedding-3-small (optional) |
| Data | Processed JSON from public-domain texts |

## Project Structure

```
argue-with-history/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/            # Pages (home, figures, debate)
│   │       ├── components/     # UI components
│   │       ├── lib/            # API client, types, era filtering
│   │       └── stores/         # Zustand (debate store)
│   │
│   └── api/                    # FastAPI backend
│       └── src/
│           ├── routers/        # figures, debate
│           ├── services/       # grok, retrieval, embedding, persistence
│           ├── models/         # schemas, figures data
│           └── core/           # config, rate limiter
│
├── data/
│   └── figures/                # Per-figure JSON indexes
│       ├── machiavelli/
│       ├── socrates/
│       └── ...
│
└── README.md
```

## Development

### Adding a New Historical Figure

1. Add figure data to `apps/api/src/models/figures.py`
2. Add persona prompt to `apps/api/src/services/prompts.py`
3. Download and process texts from Project Gutenberg
4. Create retrieval logic in `apps/api/src/services/retrieval_service.py`
5. Add JSON index under `data/figures/{figure_id}/`

### Customizing Personas

Edit the system prompts in `apps/api/src/services/prompts.py` to adjust:
- Core traits and debate style
- Response formatting
- What to avoid

## License

MIT

## Credits

- Historical texts from [Project Gutenberg](https://gutenberg.org)
- Built with Next.js, FastAPI, and Grok AI (xAI)
