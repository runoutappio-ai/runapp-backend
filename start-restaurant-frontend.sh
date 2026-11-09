#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/restaurant-frontend"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Error: Node.js and npm are required." >&2
  exit 1
fi

cd "${FRONTEND_DIR}"
if [[ ! -d node_modules ]]; then
  npm install
fi

echo "Starting Run Out Restaurant Portal at http://localhost:5174"
exec npm run dev -- "$@"
