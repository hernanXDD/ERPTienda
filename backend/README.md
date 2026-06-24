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
| `npm run db:seed` | Semilla mínima de instalación (admin + referencias). **Único seed en producción.** |
| `npm run db:seed:demo` | Datos de prueba voluminosos (**solo local**; archivos en `.gitignore`, no ejecutar en VPS) |
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
| admin | 12345678 | ADMIN |

Cambiar la contraseña del administrador antes de cualquier prueba en red compartida.

## Datos de prueba (solo desarrollo local)

Los archivos `prisma/semilla-demo.ts` y `prisma/datos/ids-semilla-demo.ts` están en **`.gitignore`**: no se suben al repositorio ni deben ejecutarse en bases de clientes.

```bash
# Tras migrate + semilla mínima, opcional en tu máquina:
npm run db:seed:demo
```

En **producción** usar únicamente `npm run db:migrate` y `npm run db:seed` (crea el admin `000001` y catálogos de referencia, sin ventas ni productos de ejemplo).

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

Guía paso a paso del despliegue: [DESPLIEGUE.md](../DESPLIEGUE.md) (raíz del repo).

### Producción — Cloudflare Pages (frontend) + 2 VPS DonWeb (2 clientes)

Cada **VPS = un cliente** con stack completo (**API + PostgreSQL**). El frontend va en **Cloudflare Pages** (un proyecto por cliente).

- **VPS Cliente 1:** Easypanel + NestJS + PostgreSQL. SSH: `erp-vps` (`200.58.99.253`, host `vps-6055529-x`). UFW y fail2ban ya activos.
- **VPS Cliente 2:** mismo stack. SSH: `erp-vps-cliente2` (configurar cuando Cliente 1 esté listo).
- **Frontend:** dos proyectos en Cloudflare Pages; cada uno con `VITE_API_BASE_URL` apuntando a **su** VPS.

Ver [DESPLIEGUE.md](../DESPLIEGUE.md) (arquitectura, SSH, fail2ban, Easypanel).

**Variables en cada VPS (`backend/.env` o Easypanel):**

```env
NODE_ENV=production
HOST=0.0.0.0
TRUST_PROXY=true
JWT_SECRETO=<secreto-aleatorio-distinto-por-cliente>
CORS_ORIGENES=https://frontend-cliente.pages.dev
DATABASE_URL=postgresql://usuario:pass@erp-postgres:5432/ERPTienda?schema=public
```

`DATABASE_URL` usa el **servicio Postgres del mismo VPS** (red Docker de Easypanel), no otro servidor.

**Cloudflare Pages (`frontend`) — un proyecto por cliente:**

```env
# Cliente 1
VITE_API_BASE_URL=https://vps-6055529-x.dattaweb.com/api

# Cliente 2
VITE_API_BASE_URL=https://host-vps-cliente-2/api
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
