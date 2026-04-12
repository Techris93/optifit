#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-4173}"
LOG_DIR="${ROOT_DIR}/.logs"

mkdir -p "${LOG_DIR}"

DEFAULT_VISION_PROVIDER="${CLOUD_VISION_PROVIDER:-}"
if [ -z "${DEFAULT_VISION_PROVIDER}" ]; then
  if [ -n "${GEMINI_API_KEY:-}" ]; then
    DEFAULT_VISION_PROVIDER="gemini"
  elif [ -n "${OPENAI_API_KEY:-}" ]; then
    DEFAULT_VISION_PROVIDER="openai"
  else
    DEFAULT_VISION_PROVIDER="local"
  fi
fi

if [ -x "/tmp/optifit-py314-install/bin/python" ]; then
  BACKEND_PYTHON="/tmp/optifit-py314-install/bin/python"
elif [ -x "${BACKEND_DIR}/venv/bin/python" ]; then
  BACKEND_PYTHON="${BACKEND_DIR}/venv/bin/python"
elif [ -x "${BACKEND_DIR}/.venv310/bin/python" ]; then
  BACKEND_PYTHON="${BACKEND_DIR}/.venv310/bin/python"
else
  echo "Backend virtualenv not found."
  echo "Run ./setup.sh first."
  exit 1
fi

if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
  echo "Frontend dependencies are missing."
  echo "Run ./setup.sh first."
  exit 1
fi

cleanup() {
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi

  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

cd "${BACKEND_DIR}"
CLOUD_VISION_PROVIDER="${DEFAULT_VISION_PROVIDER}" PYTHONPATH="${BACKEND_DIR}" "${BACKEND_PYTHON}" -m uvicorn app.main:app \
  --host "${BACKEND_HOST}" \
  --port "${BACKEND_PORT}" \
  > "${LOG_DIR}/backend.log" 2>&1 &
BACKEND_PID=$!

cd "${FRONTEND_DIR}"
npm run dev -- --host "${FRONTEND_HOST}" --port "${FRONTEND_PORT}" \
  > "${LOG_DIR}/frontend.log" 2>&1 &
FRONTEND_PID=$!

ACTUAL_FRONTEND_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}"
for _ in $(seq 1 30); do
  if grep -q "Local:" "${LOG_DIR}/frontend.log" 2>/dev/null; then
    ACTUAL_FRONTEND_URL="$(grep "Local:" "${LOG_DIR}/frontend.log" | tail -1 | sed -E 's/.*Local:[[:space:]]+//')"
    break
  fi
  sleep 0.2
done

echo "OptiFit local servers started."
echo "Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "Frontend: ${ACTUAL_FRONTEND_URL}"
echo "Vision:   ${DEFAULT_VISION_PROVIDER}"
echo "Logs:"
echo "  ${LOG_DIR}/backend.log"
echo "  ${LOG_DIR}/frontend.log"
echo ""
echo "Press Ctrl+C to stop both processes."

wait "${BACKEND_PID}" "${FRONTEND_PID}"
