#!/usr/bin/env bash
set -euo pipefail

export PORT="${PORT:-4000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "[start.sh] Installing frontend deps and building..."
cd frontend
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

echo "[start.sh] Installing backend deps..."
cd ../backend
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[start.sh] Starting server on port ${PORT}..."
npm start