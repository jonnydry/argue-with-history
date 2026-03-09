#!/bin/bash
set -e

cleanup() {
  echo "Shutting down..."
  kill $NEXT_PID 2>/dev/null || true
  kill $API_PID 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT SIGTERM SIGINT

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

wait -n $NEXT_PID $API_PID
EXIT_CODE=$?
echo "ERROR: A process exited unexpectedly with code $EXIT_CODE"
exit $EXIT_CODE
