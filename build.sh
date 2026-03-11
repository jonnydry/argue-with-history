#!/bin/bash
set -e

echo "=== Installing Python dependencies ==="
pip install -r apps/api/requirements.txt

echo "=== Installing Node dependencies ==="
cd apps/web
npm install

echo "=== Building Next.js frontend ==="
npm run build
cd ../..

echo "=== Build complete ==="
