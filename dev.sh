#!/usr/bin/env bash
# Levanta PostgreSQL (Docker), API y frontend para desarrollo local.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$raiz"

if [ ! -f backend/.env ]; then
  echo "Falta backend/.env. Ejecutá: ./scripts/preparar-desarrollo-local.sh"
  exit 1
fi

echo "→ PostgreSQL (Docker)…"
docker compose up -d

echo "→ Esperando base de datos…"
intentos=0
while [ "$intentos" -lt 20 ]; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-sa}" -d "${POSTGRES_DB:-ERPTienda}" >/dev/null 2>&1; then
    break
  fi
  intentos=$((intentos + 1))
  sleep 1
done

if [ "$intentos" -ge 20 ]; then
  echo "Error: PostgreSQL no está listo. Probá: docker compose logs postgres"
  exit 1
fi

echo "→ Backend en http://localhost:3000/api …"
(cd "$raiz/backend" && npm run start:dev) &
pid_backend=$!

echo "→ Frontend en http://localhost:5173 …"
(cd "$raiz/frontend" && npm run dev) &
pid_frontend=$!

trap 'kill $pid_backend $pid_frontend 2>/dev/null || true' INT TERM EXIT

echo ""
echo "Listo."
echo "  App:   http://localhost:5173/autenticacion/inicio-sesion"
echo "  API:   http://localhost:3000/api/salud"
echo "  Ctrl+C para detener backend y frontend (PostgreSQL sigue en Docker)."
echo ""

wait
