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

App: http://localhost:5173 — Login demo: `admin` / `12345678`

## Documentación API

[backend/README.md](backend/README.md) · [backend/API.md](backend/API.md)
