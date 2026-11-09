#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_DIR="${SCRIPT_DIR}/restaurant-frontend"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Error: Node.js and npm are required." >&2
  exit 1
fi

cd "${PORTAL_DIR}"
if [[ ! -d node_modules ]]; then
  npm install
fi

npm run demo-api &
DEMO_API_PID=$!
trap 'kill "${DEMO_API_PID}" 2>/dev/null || true' EXIT INT TERM

export VITE_API_URL="http://127.0.0.1:8090"
export VITE_DEMO_EMAIL="demo@runout.local"
export VITE_DEMO_PASSWORD="RunOutDemo2026!"

echo ""
echo "Run Out restaurant demo"
echo "URL:      http://127.0.0.1:5174"
echo "Email:    ${VITE_DEMO_EMAIL}"
echo "Password: ${VITE_DEMO_PASSWORD}"
echo ""

npm run dev -- --host 127.0.0.1
