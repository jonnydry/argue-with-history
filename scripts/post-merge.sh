#!/bin/bash
set -e

cd apps/web && npm install --no-audit --no-fund
cd ../api && pip install -q -r requirements.txt
