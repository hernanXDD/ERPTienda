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
En producción, definir un `JWT_SECRETO` largo y aleatorio.

## Migrar y levantar

```bash
npm install
npx prisma generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

| Comando | Uso |
|---------|-----|
| `npm run db:migrate` | Aplicar migraciones (`migrate deploy`) |
| `npm run db:seed` | Semilla mínima (admin + datos de referencia) |
| `npm run db:reset` | Borrar DB, migrar y sembrar (**solo desarrollo**) |
| `npm run start:dev` | API con recarga (desarrollo) |
| `npm run build` | Compilar para producción |
| `npm run start:prod` | Ejecutar build (`node dist/main`) |

Antes de `start:prod` en un entorno nuevo, ejecutar `npm run db:migrate`.

## Comprobar

- Salud: http://localhost:3000/api/salud
- Prisma Studio: `npx prisma studio`

## Login inicial (semilla)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | Ophhre43u | ADMIN |

Cambiar la contraseña del administrador antes de cualquier prueba en red compartida.

## Seguridad

| Medida | Implementación |
|--------|----------------|
| **SQL injection** | Prisma ORM con consultas parametrizadas en todos los servicios. No hay `$queryRawUnsafe` ni concatenación de SQL con input de usuario. El único SQL crudo es `SELECT 1` en el health check (sin parámetros externos). |
| **Validación de entrada** | `ValidationPipe` global (whitelist + forbidNonWhitelisted) en todos los endpoints. |
| **Autenticación** | JWT Bearer; contraseñas con bcrypt. |
| **CORS** | Orígenes explícitos vía `CORS_ORIGENES` (obligatorio en producción). |
| **Cabeceras HTTP** | `helmet` en `main.ts`. |
| **Fuerza bruta login** | Máx. 8 intentos / 15 min por IP en `POST /autenticacion/inicio-sesion`. |
| **Rate limit API** | Máx. 240 req/min por IP (configurable); excluye salud y login. |
| **Permisos de lectura** | Todos los `GET` exigen menú visible (`@RequiereMenu` / `@RequiereAlgunoMenu`). |
| **Sesión con permisos** | Login y `sesion-actual` devuelven `permisos` completos del operador. |
| **Variables de entorno** | Validación al arrancar (`validar-entorno.ts`): `DATABASE_URL`, `JWT_SECRETO`, `CORS_ORIGENES` en prod. |

Guía paso a paso del primer despliegue: [DESPLIEGUE-PRIMERA-PRUEBA.md](../DESPLIEGUE-PRIMERA-PRUEBA.md) (raíz del repo).

### Producción — Vercel (frontend) + VPS DonWeb

- **PostgreSQL:** Docker (`docker-compose.prod.yml`), puerto `127.0.0.1:5432`.
- **API:** Git + Node 20 + PM2 (`deploy/instalar-api.sh`, `deploy/ecosystem.config.cjs`).
- **nginx:** HTTPS → `127.0.0.1:3000`.

**VPS (`backend/.env`):**

```env
NODE_ENV=production
HOST=127.0.0.1
TRUST_PROXY=true
JWT_SECRETO=<secreto-aleatorio-32+-chars>
CORS_ORIGENES=https://erp-tienda.vercel.app
DATABASE_URL=postgresql://usuario:pass@127.0.0.1:5432/ERPTienda?schema=public
```

VPS: `200.58.99.253` — `vps-6055529-x.dattaweb.com`

Migraciones: `npm run db:migrate` (o `./deploy/actualizar-api.sh` tras `git pull`).

**Vercel (`frontend/.env`):**

```env
VITE_API_BASE_URL=https://vps-6055529-x.dattaweb.com/api
```

### Producción (`NODE_ENV=production`)

```env
NODE_ENV=production
JWT_SECRETO=<secreto-aleatorio-de-al-menos-32-caracteres>
CORS_ORIGENES=https://tu-dominio.com
DATABASE_URL=postgresql://...
```

## API

Ver [API.md](./API.md).
