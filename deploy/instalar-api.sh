#!/usr/bin/env bash
# Primera instalación de la API en el VPS (Node + PM2). Ejecutar desde la raíz del repo.
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
cd "$raiz"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 20+ no está instalado."
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Error: PM2 no está instalado. Ejecutar: npm install -g pm2"
  exit 1
fi

if [ ! -f backend/.env ]; then
  echo "Error: crear backend/.env desde backend/.env.production.example"
  exit 1
fi

echo "Instalando dependencias del backend..."
cd backend
npm ci
npx prisma generate
npm run build

echo "Aplicando migraciones..."
npm run db:migrate

echo "Iniciando API con PM2..."
cd "$raiz"
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo ""
echo "Instalación lista."
echo "  Salud local: curl -s http://127.0.0.1:3000/api/salud"
echo "  Semilla (solo 1ª vez): cd backend && npm run db:seed"
echo "  PM2: pm2 status / pm2 logs erp-tienda-api"
