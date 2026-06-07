#!/usr/bin/env bash
# Levanta PostgreSQL (Docker), API y frontend para desarrollo local.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "→ PostgreSQL (Docker)…"
docker compose -f "$raiz/docker-compose.yml" up -d

echo "→ Backend en http://localhost:3000/api …"
(cd "$raiz/backend" && npm run start:dev) &
pid_backend=$!

echo "→ Frontend en http://localhost:5173 …"
(cd "$raiz/frontend" && npm run dev) &
pid_frontend=$!

trap 'kill $pid_backend $pid_frontend 2>/dev/null || true' INT TERM EXIT

echo ""
echo "Listo. Abrí http://localhost:5173/autenticacion/inicio-sesion"
echo "Login: admin / Ophhre43u"
echo "Ctrl+C para detener backend y frontend."

wait
