#!/usr/bin/env bash
# Production startup script for the FastAPI backend.
# Usage: bash apps/api/start.sh [port]
set -euo pipefail

PORT="${1:-8000}"
WORKERS="${WORKERS:-4}"

echo "Starting Argue With History API on port $PORT with $WORKERS workers..."

exec gunicorn src.main:app \
  --workers "$WORKERS" \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:$PORT" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
