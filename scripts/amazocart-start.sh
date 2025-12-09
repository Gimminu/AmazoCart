#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/minu/web/AmazoCart"
LOG_DIR="/home/minu/logs"
FRONT_PORT="${FRONT_PORT:-5173}"
BACK_PORT="${BACK_PORT:-3004}"

mkdir -p "$LOG_DIR"

echo "[START] stopping any existing AmazoCart dev processes..."
# Kill stray frontend/backend dev servers so we don't double-bind ports
pkill -f "node ./node_modules/vite/bin/vite.js --host --port ${FRONT_PORT}" >/dev/null 2>&1 || true
pkill -f "node server.js" >/dev/null 2>&1 || true
pkill -f "npm run dev -- --host --port ${FRONT_PORT}" >/dev/null 2>&1 || true

echo "[START] launching backend on port ${BACK_PORT}..."
cd "$ROOT/backend"
nohup env PORT="${BACK_PORT}" npm start >"$LOG_DIR/amazocart-backend.log" 2>&1 &
echo $! >"$LOG_DIR/amazocart-backend.pid"

echo "[START] launching frontend dev on port ${FRONT_PORT}..."
cd "$ROOT"
nohup npm run dev -- --host --port "${FRONT_PORT}" >"$LOG_DIR/amazocart-frontend.log" 2>&1 &
echo $! >"$LOG_DIR/amazocart-frontend.pid"

echo "[START] done. PIDs:"
cat "$LOG_DIR/amazocart-backend.pid" "$LOG_DIR/amazocart-frontend.pid" 2>/dev/null
