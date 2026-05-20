# Backend — ERP Tienda

API con **NestJS**, **Prisma** y **PostgreSQL**.

## Requisitos

- Node.js 20+
- Docker (para PostgreSQL local)

## Paso 1 — Base de datos (Docker)

Desde la **raíz del proyecto**:

```bash
cp .env.example .env
docker compose up -d
```

Verificá que el contenedor esté sano:

```bash
docker compose ps
```

## Paso 2 — Variables del backend

```bash
cd backend
cp .env.example .env
```

El `DATABASE_URL` debe coincidir con `docker-compose.yml` (por defecto: usuario `sa`, contraseña `6561`, base `ERPTienda`).

## Paso 3 — Dependencias y migración

```bash
npm install
npx prisma migrate dev --name inicial
npm run start:dev
```

## Comprobar

- Salud: [http://localhost:3000/api/salud](http://localhost:3000/api/salud)
- Prisma Studio: `npm run prisma:studio`

## Estructura prevista

```
src/
  main.ts
  app.module.ts
  prisma/          # Servicio global Prisma
  modulos/         # auth, usuarios, catalogo… (próximos pasos)
prisma/
  schema.prisma    # Modelo 3FN alineado al frontend
```

## Autenticación (listo para probar cuando levantes la base)

Rutas (prefijo `/api`):

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/autenticacion/inicio-sesion` | Login (`nombreUsuario`, `contrasena`) |
| GET | `/autenticacion/sesion-actual` | Bearer token |
| POST | `/autenticacion/cierre-sesion` | Bearer token (stateless) |

Semilla de usuarios (mismos que el mock del frontend):

| Usuario | Contraseña | Rol | Nombre mostrado |
|---------|------------|-----|-----------------|
| admin | Ophhre43u | ADMIN | Administrador |
| dueño | dueño | DUEÑO | Roberto Gestión Local |
| empleado | empleado | EMPLEADO | Laura Mostrador |

Tras la primera migración: `npm run prisma:semilla`

## API completa

Ver [API.md](./API.md) con todas las rutas.

Módulos implementados: autenticación, categorías, catálogo, clientes, cuenta corriente, proveedores, stock, compras, ventas, usuarios.

## Próximos pasos (cuando conectes el frontend)

1. `docker compose up -d` + `npx prisma migrate dev` + `npm run prisma:semilla`
2. En Vite: proxy `/api` → `http://localhost:3000` y `VITE_USAR_SIMULADOR=false`
3. Swagger, Helmet, rate limit (endurecimiento producción)
