#!/usr/bin/env bash
# Borra PostgreSQL local (volumen Docker) y aplica migraciones + semilla desde cero.
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
cd "$raiz"

echo "=== ERP Tienda — reinicio de base local (como primera migración) ==="
echo ""
echo "⚠ Esto elimina TODOS los datos del contenedor PostgreSQL de desarrollo."
echo ""

echo "→ Deteniendo PostgreSQL y borrando volumen…"
docker compose down -v

echo "→ Levantando PostgreSQL vacío…"
docker compose up -d

echo "→ Esperando base de datos…"
intentos=0
while [ "$intentos" -lt 30 ]; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-sa}" -d "${POSTGRES_DB:-ERPTienda}" >/dev/null 2>&1; then
    break
  fi
  intentos=$((intentos + 1))
  sleep 1
done

if [ "$intentos" -ge 30 ]; then
  echo "Error: PostgreSQL no respondió a tiempo."
  exit 1
fi

echo "→ Migraciones + semilla mínima…"
(cd backend && npx prisma generate && npm run db:migrate && npm run db:seed)

echo ""
echo "Listo. Base local como instalación nueva."
echo "  ./dev.sh"
echo "  Login: http://localhost:5173/autenticacion/inicio-sesion"
echo "  Usuario semilla: admin / 12345678 (cambiar en el primer ingreso)"
echo ""
