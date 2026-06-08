#!/usr/bin/env bash
# Actualiza la API tras git pull (build + migraciones + reinicio PM2).
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
cd "$raiz"

echo "Actualizando código..."
git pull

echo "Instalando dependencias y compilando..."
cd backend
npm ci
npx prisma generate
npm run build

echo "Aplicando migraciones..."
npm run db:migrate

echo "Reiniciando API..."
cd "$raiz"
pm2 reload deploy/ecosystem.config.cjs --update-env

echo "Listo. Comprobar: curl -s http://127.0.0.1:3000/api/salud"
