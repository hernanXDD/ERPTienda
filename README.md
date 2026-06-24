# ERP Tienda

Sistema de gestión para tienda de ropa — **Vue 3** (frontend) + **NestJS** (API) + **PostgreSQL** (Prisma).

## Requisitos

- Node.js 20+
- Docker (PostgreSQL local)

## Variables de entorno (una vez)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Si el puerto **5432** ya está en uso, editá `.env` (`POSTGRES_PORT=5433`) y `backend/.env` (`DATABASE_URL` con el mismo puerto).

## Base de datos (Docker)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

## Backend — migrar y levantar

Todos los comandos se ejecutan dentro de `backend/`:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start
```

Desarrollo con recarga automática: `npm run start:dev` en lugar de `npm run start`.

Comprobar API: http://localhost:3000/api/salud

**Primera vez en local** (crear la migración inicial, solo una vez):

```bash
npx prisma migrate dev --name inicial
npx prisma db seed
```

Luego, en adelante, usar siempre `npx prisma migrate deploy`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 — Login inicial (semilla): `admin` / `12345678`

Para cargar productos, ventas y movimientos de ejemplo **solo en tu PC**, ver `backend/README.md` (`npm run db:seed:demo`; no se versiona ni va a producción).

## Tests automáticos

Desde la raíz (backend + frontend):

```bash
npm test
```

Por separado:

```bash
cd backend && npm test          # Jest: unitarios + e2e (salud)
cd frontend && npm test         # Vitest
cd frontend && npm run test:watch   # modo watch
```

Los tests no requieren PostgreSQL en ejecución (el e2e de salud usa Prisma simulado).

## Documentación API y despliegue

[backend/README.md](backend/README.md) · [backend/API.md](backend/API.md) · [DESPLIEGUE.md](DESPLIEGUE.md) · [DESPLIEGUE.pdf](DESPLIEGUE.pdf)
