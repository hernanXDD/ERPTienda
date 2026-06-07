# Backend — ERP Tienda

API con **NestJS**, **Prisma** y **PostgreSQL**.

## Requisitos

- Node.js 20+
- PostgreSQL (Docker: `docker compose up -d` desde la raíz del proyecto)

## Variables

```bash
cp .env.example .env
```

`DATABASE_URL` debe coincidir con `docker-compose.yml` de la raíz.

## Migrar y levantar

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start
```

| Comando | Uso |
|---------|-----|
| `npm run start` | API en modo normal |
| `npm run start:dev` | API con recarga (desarrollo) |
| `npm run build` | Compilar para producción |
| `npm run start:prod` | Ejecutar build (`node dist/main`) |

**Primera migración** (solo una vez, entorno nuevo):

```bash
npx prisma migrate dev --name inicial
npx prisma db seed
```

## Comprobar

- Salud: http://localhost:3000/api/salud
- Prisma Studio: `npx prisma studio`

## Login demo (semilla)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | Ophhre43u | ADMIN |
| dueño | dueño | DUEÑO |
| empleado | empleado | EMPLEADO |

## API

Ver [API.md](./API.md).
