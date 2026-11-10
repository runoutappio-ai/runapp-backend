#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${ROOT_DIR}/.run/logs"
STRIPE_DIR="${ROOT_DIR}/.run/stripe"
STRIPE_LISTENER_LOG=""
RESTAURANT_DEMO=false
STOP_INFRA=false
PIDS=()
LABELS=()

usage() {
  cat <<'EOF'
Usage: ./start-all.sh [options]

Starts PostgreSQL, Keycloak, the Spring API, staff backoffice, restaurant
portal, and the demo hub on port 8000.
Uses Stripe sandbox for payments when .run/stripe/backend.key is configured.

Options:
  --restaurant-demo  Run the restaurant portal with the populated demo login
                     (demo@runout.local / RunOutDemo2026!) on an in-memory API.
  --stop-infra       Stop PostgreSQL and Keycloak when this script exits.
  -h, --help         Show this help.

Press Ctrl+C to stop every process started by this script.
EOF
}

while (($#)); do
  case "$1" in
    --restaurant-demo) RESTAURANT_DEMO=true ;;
    --stop-infra) STOP_INFRA=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: $1 is required but was not found in PATH." >&2
    exit 1
  fi
}

for command_name in docker mvn node npm python3 curl lsof pgrep; do
  require_command "${command_name}"
done

port_is_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

check_port() {
  if port_is_busy "$1"; then
    echo "Error: port $1 is already in use. Stop the existing service and run this script again." >&2
    exit 1
  fi
}

stop_tree() {
  local parent="$1"
  local child
  while read -r child; do
    [[ -n "${child}" ]] && stop_tree "${child}"
  done < <(pgrep -P "${parent}" 2>/dev/null || true)
  kill "${parent}" 2>/dev/null || true
}

cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "Stopping Run Out services..."
  local index
  for ((index=${#PIDS[@]}-1; index>=0; index--)); do
    if kill -0 "${PIDS[$index]}" 2>/dev/null; then
      echo "  stopping ${LABELS[$index]}"
      stop_tree "${PIDS[$index]}"
    fi
  done
  if [[ "${STOP_INFRA}" == true ]]; then
    docker compose -f "${ROOT_DIR}/compose.yml" down
  else
    echo "  PostgreSQL and Keycloak remain running (use docker compose down to stop them)."
  fi
  if [[ -n "${STRIPE_LISTENER_LOG}" ]]; then
    rm -f -- "${STRIPE_LISTENER_LOG}"
  fi
}
trap cleanup EXIT INT TERM

start_process() {
  local label="$1"
  local log_file="$2"
  shift 2
  "$@" >"${log_file}" 2>&1 &
  PIDS+=("$!")
  LABELS+=("${label}")
  echo "  started ${label} (log: ${log_file#"${ROOT_DIR}/"})"
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local attempts="$3"
  local process_id="${4:-}"
  local attempt
  for ((attempt=1; attempt<=attempts; attempt++)); do
    if curl --silent --fail --max-time 2 "${url}" >/dev/null 2>&1; then
      return 0
    fi
    if [[ -n "${process_id}" ]] && ! kill -0 "${process_id}" 2>/dev/null; then
      echo "Error: ${label} stopped during startup." >&2
      return 1
    fi
    sleep 1
  done
  echo "Error: ${label} did not become ready at ${url}." >&2
  return 1
}

url_is_ready() {
  curl --silent --fail --max-time 2 "$1" >/dev/null 2>&1
}

configure_stripe() {
  if [[ -z "${STRIPE_SECRET_KEY:-}" && -s "${STRIPE_DIR}/backend.key" ]]; then
    STRIPE_SECRET_KEY="$(<"${STRIPE_DIR}/backend.key")"
  fi
  case "${STRIPE_SECRET_KEY:-}" in
    sk_test_*|rk_test_*) ;;
    *) echo "Error: Stripe requires a test key in .run/stripe/backend.key or STRIPE_SECRET_KEY." >&2; return 1 ;;
  esac

  if [[ -z "${STRIPE_CHECKOUT_RETURN_URL:-}" && -s "${STRIPE_DIR}/return-url" ]]; then
    STRIPE_CHECKOUT_RETURN_URL="$(<"${STRIPE_DIR}/return-url")"
  fi
  if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
    return
  fi

  require_command stripe
  mkdir -p "${STRIPE_DIR}"
  STRIPE_LISTENER_LOG="$(mktemp "${STRIPE_DIR}/listener.XXXXXX")"
  start_process "Stripe sandbox webhook" "${STRIPE_LISTENER_LOG}" stripe listen \
    --events checkout.session.completed,checkout.session.async_payment_succeeded,payment_intent.succeeded \
    --forward-to http://127.0.0.1:8080/api/v1/payments/stripe/webhook
  local listener_pid="${PIDS[${#PIDS[@]}-1]}"
  local attempt
  for ((attempt=1; attempt<=30; attempt++)); do
    if ! kill -0 "${listener_pid}" 2>/dev/null; then
      break
    fi
    STRIPE_WEBHOOK_SECRET="$(sed -nE 's/.*(whsec_[[:alnum:]_]+).*/\1/p' "${STRIPE_LISTENER_LOG}" | head -n 1)"
    if [[ -n "${STRIPE_WEBHOOK_SECRET}" ]]; then
      return
    fi
    sleep 1
  done
  echo "Error: Stripe webhook did not start. Run stripe login and select the Run Out sandbox." >&2
  return 1
}

mkdir -p "${LOG_DIR}"

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker is installed but its engine is not running." >&2
  exit 1
fi

echo "Preparing frontend dependencies..."
for frontend_dir in frontend restaurant-frontend; do
  if [[ ! -d "${ROOT_DIR}/${frontend_dir}/node_modules" ]]; then
    (cd "${ROOT_DIR}/${frontend_dir}" && npm install)
  fi
done

echo "Starting PostgreSQL and Keycloak..."
docker compose -f "${ROOT_DIR}/compose.yml" up -d
wait_for_url "Keycloak" "http://127.0.0.1:8081/realms/runout/.well-known/openid-configuration" 120

echo "Starting application services..."
if [[ -z "${PAYMENT_PROVIDER:-}" ]]; then
  PAYMENT_PROVIDER=mock
  if [[ -s "${STRIPE_DIR}/backend.key" ]]; then
    PAYMENT_PROVIDER=stripe
  fi
fi
export PAYMENT_PROVIDER
export RUNOUT_DEMO_SKIP_WAIT_ENABLED="${RUNOUT_DEMO_SKIP_WAIT_ENABLED:-true}"
STRIPE_RETURN="http://127.0.0.1:8080/api/v1/stripe/return"
if url_is_ready "http://127.0.0.1:8080/actuator/health"; then
  if [[ "${PAYMENT_PROVIDER}" == stripe ]] && ! url_is_ready "${STRIPE_RETURN}"; then
    echo "Error: port 8080 is running without Stripe. Stop that backend and run ./start-all.sh again." >&2
    exit 1
  fi
  echo "  reusing Spring API already running on port 8080"
else
  check_port 8080
  if [[ "${PAYMENT_PROVIDER}" == stripe ]]; then
    configure_stripe
    export STRIPE_CHECKOUT_RETURN_URL STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
  fi
  start_process "Spring API" "${LOG_DIR}/backend.log" bash -c "cd '${ROOT_DIR}' && exec mvn spring-boot:run"
  BACKEND_PID="${PIDS[${#PIDS[@]}-1]}"
  wait_for_url "Spring API" "http://127.0.0.1:8080/actuator/health" 120 "${BACKEND_PID}" || {
    tail -n 80 "${LOG_DIR}/backend.log" >&2
    exit 1
  }
  if [[ "${PAYMENT_PROVIDER}" == stripe ]]; then
    wait_for_url "Stripe return page" "${STRIPE_RETURN}" 10 "${BACKEND_PID}"
  fi
fi
unset STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET

if url_is_ready "http://127.0.0.1:5173"; then
  echo "  reusing staff backoffice already running on port 5173"
else
  check_port 5173
  start_process "staff backoffice" "${LOG_DIR}/backoffice.log" bash -c "cd '${ROOT_DIR}/frontend' && exec ./node_modules/.bin/vite --host 127.0.0.1"
fi

if [[ "${RESTAURANT_DEMO}" == true ]]; then
  if url_is_ready "http://127.0.0.1:8090/api/restaurant-portal/me"; then
    echo "  reusing restaurant demo API already running on port 8090"
  else
    check_port 8090
    start_process "restaurant demo API" "${LOG_DIR}/restaurant-demo-api.log" bash -c "cd '${ROOT_DIR}/restaurant-frontend' && exec node demo-api.mjs"
  fi
  if url_is_ready "http://127.0.0.1:5174"; then
    echo "Error: a restaurant portal is already running on port 5174; stop it before selecting --restaurant-demo." >&2
    exit 1
  fi
  check_port 5174
  start_process "restaurant portal" "${LOG_DIR}/restaurant-portal.log" bash -c "cd '${ROOT_DIR}/restaurant-frontend' && exec env VITE_API_URL=http://127.0.0.1:8090 VITE_DEMO_EMAIL=demo@runout.local VITE_DEMO_PASSWORD='RunOutDemo2026!' ./node_modules/.bin/vite --host 127.0.0.1"
else
  if url_is_ready "http://127.0.0.1:5174"; then
    echo "  reusing restaurant portal already running on port 5174"
  else
    check_port 5174
    start_process "restaurant portal" "${LOG_DIR}/restaurant-portal.log" bash -c "cd '${ROOT_DIR}/restaurant-frontend' && exec ./node_modules/.bin/vite --host 127.0.0.1"
  fi
fi

if url_is_ready "http://127.0.0.1:8000"; then
  echo "  reusing integrated demo hub already running on port 8000"
else
  check_port 8000
  start_process "integrated demo hub" "${LOG_DIR}/demo-hub.log" python3 -m http.server 8000 --bind 127.0.0.1 --directory "${ROOT_DIR}/mobile/runout-web-demo"
fi

wait_for_url "staff backoffice" "http://127.0.0.1:5173" 30
wait_for_url "restaurant portal" "http://127.0.0.1:5174" 30
wait_for_url "integrated demo hub" "http://127.0.0.1:8000" 30

echo ""
echo "Run Out is ready"
echo "  API:                http://127.0.0.1:8080"
echo "  Swagger:            http://127.0.0.1:8080/swagger-ui.html"
echo "  Keycloak:           http://127.0.0.1:8081"
echo "  Staff backoffice:   http://127.0.0.1:5173"
echo "  Restaurant portal:  http://127.0.0.1:5174"
echo "  Complete demo hub:  http://127.0.0.1:8000"
if [[ "${RESTAURANT_DEMO}" == true ]]; then
  echo ""
  echo "Restaurant demo login"
  echo "  Email:    demo@runout.local"
  echo "  Password: RunOutDemo2026!"
  echo "  Note: restaurant demo edits reset when this script stops."
fi
echo ""
echo "Logs: ${LOG_DIR}"
echo "Press Ctrl+C to stop the application processes."

while true; do
  sleep 3600 &
  wait $!
done
