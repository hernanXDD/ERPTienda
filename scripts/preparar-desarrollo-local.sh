#!/usr/bin/env bash
# Prepara el entorno local: .env, Docker PostgreSQL, migraciones y semilla.
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
cd "$raiz"

echo "=== ERP Tienda — preparar desarrollo local ==="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Creado .env (revisá POSTGRES_PORT si 5432 está ocupado)"
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "→ Creado backend/.env"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "→ Creado frontend/.env"
fi

puerto_db="$(grep -E '^POSTGRES_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 5432)"
puerto_db="${puerto_db:-5432}"

if ss -tln 2>/dev/null | grep -q ":${puerto_db} "; then
  if ! docker compose ps --status running 2>/dev/null | grep -q postgres; then
    echo "⚠ Puerto ${puerto_db} en uso. Si no es el contenedor ERP, cambiá POSTGRES_PORT en .env y DATABASE_URL en backend/.env"
  fi
fi

echo "→ PostgreSQL (Docker, puerto ${puerto_db})…"
docker compose up -d

echo "→ Esperando base de datos…"
intentos=0
hasta=30
while [ "$intentos" -lt "$hasta" ]; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-sa}" -d "${POSTGRES_DB:-ERPTienda}" >/dev/null 2>&1; then
    break
  fi
  intentos=$((intentos + 1))
  sleep 1
done

if [ "$intentos" -ge "$hasta" ]; then
  echo "Error: PostgreSQL no respondió a tiempo."
  exit 1
fi

echo "→ Dependencias backend…"
(cd backend && npm ci)

echo "→ Dependencias frontend…"
(cd frontend && npm ci)

echo "→ Prisma generate + migraciones + semilla…"
(cd backend && npx prisma generate && npm run db:migrate && npm run db:seed)

echo ""
echo "Listo para desarrollo local."
echo "  ./dev.sh"
echo "  o en terminales separadas: npm run start:dev (backend) y npm run dev (frontend)"
echo ""
echo "  Login: http://localhost:5173/autenticacion/inicio-sesion"
echo "  Usuario: admin / 12345678"
echo "  API salud: http://localhost:3000/api/salud"
