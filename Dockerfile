FROM python:3.11-slim

WORKDIR /app

# Copy repo (we need data/ and apps/api/)
COPY . .

# Install Python deps
RUN pip install --no-cache-dir -r apps/api/requirements.txt

# Run from apps/api
WORKDIR /app/apps/api

EXPOSE 8000

# Railway injects PORT at runtime
CMD gunicorn src.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}
