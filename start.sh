#!/bin/bash
set -e

echo "=== Building Next.js frontend ==="
cd apps/web
npm run build
cd ../..

echo "=== Starting FastAPI backend ==="
cd apps/api
gunicorn src.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:3001 \
  --workers 2 \
  --timeout 120 \
  --graceful-timeout 30 &
API_PID=$!
cd ../..

sleep 2

if ! kill -0 $API_PID 2>/dev/null; then
  echo "ERROR: API failed to start"
  exit 1
fi

echo "=== Starting Next.js production server ==="
cd apps/web
PORT=5000 npx next start -H 0.0.0.0 &
NEXT_PID=$!
cd ../..

cleanup() {
  echo "Shutting down..."
  kill $NEXT_PID 2>/dev/null || true
  kill $API_PID 2>/dev/null || true
  wait
}
trap cleanup SIGTERM SIGINT

wait $NEXT_PID $API_PID
