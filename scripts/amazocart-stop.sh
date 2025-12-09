#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="/home/minu/logs"
FRONT_PORT="${FRONT_PORT:-5173}"
BACK_PORT="${BACK_PORT:-3004}"

stop_pidfile() {
  local file=$1
  if [[ -f "$file" ]]; then
    local pid
    pid=$(cat "$file")
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" || true
      wait "$pid" 2>/dev/null || true
      echo "[STOP] killed pid $pid from $file"
    fi
    rm -f "$file"
  fi
}

echo "[STOP] stopping AmazoCart frontend/backend..."
stop_pidfile "$LOG_DIR/amazocart-frontend.pid"
stop_pidfile "$LOG_DIR/amazocart-backend.pid"

# Fallback: kill any lingering dev servers on known ports/commands
pkill -f "node ./node_modules/vite/bin/vite.js --host --port ${FRONT_PORT}" >/dev/null 2>&1 || true
pkill -f "npm run dev -- --host --port ${FRONT_PORT}" >/dev/null 2>&1 || true
pkill -f "node server.js" >/dev/null 2>&1 || true

echo "[STOP] done."
