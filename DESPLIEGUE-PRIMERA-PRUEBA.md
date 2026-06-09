# Primera prueba en producción — ERP Tienda

Guía paso a paso para el **primer despliegue de prueba** en el negocio.

Orden recomendado: **Git → Vercel (frontend) → VPS (base + API + CORS)**.  
Subí el frontend primero para obtener la URL exacta de Vercel y configurar `CORS_ORIGENES` en el backend.

---

## Resumen de arquitectura

| Componente | Dónde | Cómo |
|------------|-------|------|
| Frontend (Vue) | Vercel | Build automático desde Git |
| PostgreSQL | VPS DonWeb | Docker (`docker-compose.prod.yml`) |
| API (NestJS) | VPS DonWeb | Git + Node 20 + PM2 + nginx |

### VPS (DonWeb / DattaWeb)

| Dato | Valor |
|------|-------|
| **IP** | `200.58.99.253` |
| **Host** | `vps-6055529-x.dattaweb.com` |
| **API pública** | `https://vps-6055529-x.dattaweb.com/api` |
| CPU | 2 vCPU |
| RAM | 2 GB |
| Disco | 20 GB SSD |

Conexión SSH:

```bash
ssh usuario@200.58.99.253
# o
ssh usuario@vps-6055529-x.dattaweb.com
```

RAM orientativa en el VPS:

| Proceso | Límite |
|---------|--------|
| PostgreSQL (Docker) | 512 MB |
| API Node (PM2) | 450 MB |
| nginx + SO | resto (~1 GB) |

---

## Datos que vas anotando

Completá esto a medida que avanzás (copiá y pegá en un bloc de notas):

```
Repositorio Git:     _______________________________________________
URL frontend Vercel:   _______________________________________________
VITE_API_BASE_URL:     https://vps-6055529-x.dattaweb.com/api
CORS_ORIGENES (VPS):   _______________________________________________
POSTGRES_USER:         erp  (o el que elijas)
POSTGRES_PASSWORD:     _______________________________________________
JWT_SECRETO:           _______________________________________________
Usuario SSH VPS:       _______________________________________________
Ruta del repo en VPS:  /opt/ERPTienda  (o la que uses)
```

> **CORS:** la URL de Vercel debe coincidir **exactamente** (con `https://`, sin barra final).  
> Si Vercel te da preview en otra URL, agregala separada por coma en `CORS_ORIGENES`.

---

## Fase 1 — Subir el código a Git

Desde tu máquina de desarrollo (con los cambios listos):

```bash
cd ERPTienda
git status
git add -A
git commit -m "Preparar primera prueba en producción"
git push origin main
```

Vercel y el VPS van a desplegar **desde este repositorio**. Cada mejora futura: commit → push → Vercel redeploy automático y en el VPS `./deploy/actualizar-api.sh`.

---

## Fase 2 — Vercel (frontend primero)

Objetivo: tener la **URL pública del frontend** antes de cerrar la configuración del backend.

### 2.1 Crear el proyecto

1. Entrá a [vercel.com](https://vercel.com) → **Add New Project**.
2. Importá el repositorio de GitHub/GitLab.
3. Configuración del proyecto:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite (detectado automáticamente) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 2.2 Variable de entorno en Vercel

En **Settings → Environment Variables → Production**:

| Nombre | Valor |
|--------|-------|
| `VITE_API_BASE_URL` | `https://vps-6055529-x.dattaweb.com/api` |

Referencia local: `frontend/.env.production.example`.

> La API puede no responder todavía; no importa. Lo que necesitás ahora es la **URL de Vercel** (ej. `https://erp-tienda.vercel.app` o la que asigne el proyecto).

### 2.3 Primer deploy

1. Clic en **Deploy**.
2. Cuando termine, copiá la URL de producción (ej. `https://erp-tienda.vercel.app`).
3. Anotala en **CORS_ORIGENES** — la vas a usar en la Fase 4.

### 2.4 Dominio propio (opcional)

Si más adelante usás un dominio custom en Vercel, agregalo también a `CORS_ORIGENES` en el VPS y volvé a cargar PM2.

---

## Fase 3 — VPS: requisitos y clonar

### 3.1 Software en el servidor

- Ubuntu/Debian con SSH.
- **Docker** + **Docker Compose v2**.
- **Node.js 20 LTS**.
- **PM2:** `npm install -g pm2`.
- **nginx** + **Certbot** (HTTPS).
- **Git** + acceso al repositorio (SSH o HTTPS).

Firewall: solo puertos **22**, **80** y **443**.  
**No** exponer **5432** (Postgres) ni **3000** (API) a internet.

### 3.2 Clonar el proyecto

```bash
cd /opt
git clone https://github.com/hernanXDD/ERPTienda.git
cd ERPTienda
git pull origin main
```

Reemplazá `TU_USUARIO/ERPTienda` por tu repo real.

---

## Fase 4 — VPS: PostgreSQL (Docker)

```bash
cp .env.production.example .env.production
nano .env.production   # o el editor que uses
```

Contenido de `.env.production` (referencia: `.env.production.example`):

```env
POSTGRES_USER=erp
POSTGRES_PASSWORD=TU_PASSWORD_FUERTE
POSTGRES_DB=ERPTienda
```

Levantar la base:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml ps
```

PostgreSQL queda en **`127.0.0.1:5432`** (solo desde el propio VPS).

---

## Fase 5 — VPS: variables de la API

```bash
cp backend/.env.production.example backend/.env
nano backend/.env
```

| Variable | Qué poner |
|----------|-----------|
| `NODE_ENV` | `production` |
| `HOST` | `127.0.0.1` |
| `PUERTO` | `3000` |
| `DATABASE_URL` | `postgresql://erp:TU_PASSWORD@127.0.0.1:5432/ERPTienda?schema=public` |
| `JWT_SECRETO` | Aleatorio, **mínimo 32 caracteres** |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGENES` | **URL exacta de Vercel** (Fase 2), ej. `https://erp-tienda.vercel.app` |
| `TRUST_PROXY` | `true` |

Generar `JWT_SECRETO`:

```bash
openssl rand -base64 48
```

> `erp` y `TU_PASSWORD` deben coincidir con `.env.production` de PostgreSQL.

Ejemplo de `CORS_ORIGENES` con producción + preview:

```env
CORS_ORIGENES=https://erp-tienda.vercel.app,https://erp-tienda-git-main-tuusuario.vercel.app
```

---

## Fase 6 — VPS: instalar y arrancar la API

```bash
chmod +x deploy/instalar-api.sh deploy/actualizar-api.sh
./deploy/instalar-api.sh
```

Semilla (**solo la primera vez**, crea usuario `admin`):

```bash
cd backend && npm run db:seed
```

Credenciales iniciales — **cambiar en el primer login**:

| Usuario | Contraseña |
|---------|------------|
| admin | 12345678 |

Comprobar en el VPS:

```bash
curl -s http://127.0.0.1:3000/api/salud
pm2 status
```

PM2 al reiniciar el VPS (una sola vez):

```bash
pm2 startup    # ejecutar el comando que imprime
pm2 save
```

---

## Fase 7 — VPS: nginx + HTTPS

1. Copiar y adaptar `deploy/nginx/erp-tienda-api.conf.example` a `/etc/nginx/sites-available/`.
2. Certificado:

   ```bash
   sudo certbot --nginx -d vps-6055529-x.dattaweb.com
   ```

3. Activar sitio y recargar:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

Comprobar desde **tu PC** (fuera del VPS):

```bash
curl -s https://vps-6055529-x.dattaweb.com/api/salud
```

Debería responder JSON con estado OK.

---

## Fase 8 — Probar el frontend contra la API

1. Abrí la URL de Vercel en el navegador.
2. Iniciá sesión con `admin` / `12345678`.
3. El sistema pedirá **cambio de contraseña** en el primer acceso.
4. Completá **Configuración → Datos del negocio** (nombre, CUIT, etc.).

Si el login falla con error de CORS en la consola del navegador:

- Revisá que `CORS_ORIGENES` en `backend/.env` sea **exactamente** la URL de Vercel.
- Editá `backend/.env` y recargá: `pm2 reload erp-tienda-api`.

---

## Actualizaciones futuras

Tras `git push` con cambios de código o migraciones:

```bash
cd /opt/ERPTienda
./deploy/actualizar-api.sh
```

Eso hace: `git pull` → `npm ci` → `build` → `prisma migrate deploy` → `pm2 reload`.

Vercel redeploya el frontend solo al detectar el push (si está conectado al repo).

Migración manual si hace falta:

```bash
cd backend
npm run db:migrate
pm2 reload erp-tienda-api
```

---

## Errores frecuentes

| Síntoma | Causa probable | Qué hacer |
|---------|----------------|-----------|
| Error CORS en el navegador | `CORS_ORIGENES` no coincide con la URL de Vercel | Corregir `backend/.env` y `pm2 reload erp-tienda-api` |
| 502 Bad Gateway | PM2 caído o API no escucha | `pm2 logs erp-tienda-api` / `pm2 restart erp-tienda-api` |
| ECONNREFUSED / error de DB | Postgres apagado o `DATABASE_URL` mal | `docker compose -f docker-compose.prod.yml ps` |
| Login 401 | Semilla no ejecutada | `cd backend && npm run db:seed` |
| API se reinicia sola | Poca RAM (2 GB) | `free -h`, `docker stats`, `pm2 logs` |
| Frontend no llama a la API | `VITE_API_BASE_URL` mal en Vercel | Revisar variable y **Redeploy** en Vercel |

---

## Comandos útiles en el VPS

```bash
# Logs API
pm2 logs erp-tienda-api

# Reinicio manual
pm2 restart erp-tienda-api

# Estado recursos
free -h
docker stats --no-stream

# Backup Postgres (ejemplo manual)
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U erp ERPTienda > backup-$(date +%F).sql
```

---

## Seguridad mínima antes de usar datos reales

- Cambiar contraseña de `admin` en el primer login.
- `JWT_SECRETO` y `POSTGRES_PASSWORD` fuertes y únicos.
- Postgres solo en `127.0.0.1:5432`.
- API en `HOST=127.0.0.1` (nginx como única puerta pública).
- Firewall: 22, 80, 443 únicamente.
- Backup de la base antes de cargar datos del negocio.

---

## Desarrollo local

Sigue igual que siempre:

```bash
docker compose up -d          # Postgres local
./dev.sh                      # o backend + frontend por separado
```

`docker-compose.prod.yml` es **solo** para PostgreSQL en el VPS; la API en desarrollo usa `npm run start:dev`.
