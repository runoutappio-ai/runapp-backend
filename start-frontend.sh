#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js no está instalado o no está disponible en PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm no está instalado o no está disponible en PATH." >&2
  exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
  echo "Error: no se encontró ${FRONTEND_DIR}/package.json." >&2
  exit 1
fi

cd "${FRONTEND_DIR}"

if [[ ! -d node_modules ]]; then
  echo "Instalando dependencias del frontend..."
  npm install
fi

echo "Iniciando Run Out Admin en http://localhost:5173"
exec npm run dev -- "$@"
