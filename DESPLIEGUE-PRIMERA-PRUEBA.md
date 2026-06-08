# Primera prueba en producción — ERP Tienda

Arquitectura objetivo:

| Componente | Dónde | Cómo |
|------------|-------|------|
| Frontend (Vue) | Vercel | Build automático desde Git |
| PostgreSQL | VPS DonWeb | **Docker** (solo la base) |
| API (NestJS) | VPS DonWeb | **Git + Node 20 + PM2** |

### VPS (DonWeb / DattaWeb)

| Dato | Valor |
|------|-------|
| **IP** | `200.58.99.253` |
| **Host** | `vps-6055529-x.dattaweb.com` |
| **API pública** | `https://vps-6055529-x.dattaweb.com/api` |
| CPU | 2 vCPU Standard |
| RAM | 2 GB |
| Disco | 20 GB SSD |
| Transferencia | 1 TB/mes |

Conexión SSH:

```bash
ssh usuario@200.58.99.253
# o
ssh usuario@vps-6055529-x.dattaweb.com
```

Distribución de RAM orientativa:

| Proceso | Límite |
|---------|--------|
| PostgreSQL (Docker) | 512 MB (`mem_limit` en compose) |
| API Node (PM2) | 450 MB (`max_memory_restart`) |
| nginx + SO | resto (~1 GB) |

---

## 1. Requisitos previos en el VPS

- Ubuntu/Debian con acceso SSH.
- **Docker** y **Docker Compose v2**.
- **Node.js 20 LTS** ([nodesource](https://github.com/nodesource/distributions) o `nvm`).
- **PM2** global: `npm install -g pm2`.
- **nginx** + **Certbot** (HTTPS).
- **Git** y clave SSH al repositorio.
- El host `vps-6055529-x.dattaweb.com` debe resolver a `200.58.99.253` (viene así en DonWeb).

Firewall: abrir solo **22**, **80** y **443**. No exponer **5432** ni **3000** a internet.

---

## 2. Clonar el proyecto

```bash
cd /opt   # o el directorio que prefieras
git clone git@github.com:TU_USUARIO/ERPTienda.git
cd ERPTienda
```

---

## 3. PostgreSQL (Docker)

```bash
cp .env.production.example .env.production
```

Editar `.env.production`:

- `POSTGRES_USER` / `POSTGRES_PASSWORD` — contraseña fuerte.
- `POSTGRES_DB` — por defecto `ERPTienda`.

Levantar solo la base:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml ps
```

PostgreSQL queda en **`127.0.0.1:5432`** (solo accesible desde el propio VPS).

---

## 4. Variables de la API

```bash
cp backend/.env.production.example backend/.env
```

Editar `backend/.env`:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://USUARIO:PASSWORD@127.0.0.1:5432/ERPTienda?schema=public` |
| `JWT_SECRETO` | Aleatorio, **mínimo 32 caracteres** |
| `CORS_ORIGENES` | URL **exacta** de Vercel (ej. `https://erp-tienda.vercel.app`) |
| `HOST` | `127.0.0.1` (solo nginx accede a la API) |
| `TRUST_PROXY` | `true` |

Generar JWT:

```bash
openssl rand -base64 48
```

> `USUARIO` y `PASSWORD` deben coincidir con `.env.production` de PostgreSQL.

---

## 5. Instalar y arrancar la API

```bash
chmod +x deploy/instalar-api.sh deploy/actualizar-api.sh
./deploy/instalar-api.sh
```

Semilla (**solo la primera vez**):

```bash
cd backend && npm run db:seed
```

Credenciales iniciales (cambiar tras el primer login):

| Usuario | Contraseña |
|---------|------------|
| admin | Ophhre43u |

Comprobar:

```bash
curl -s http://127.0.0.1:3000/api/salud
pm2 status
```

PM2 al reiniciar el VPS:

```bash
pm2 startup    # ejecutar el comando que imprime (una sola vez)
pm2 save
```

---

## 6. nginx + HTTPS

1. Copiar y adaptar `deploy/nginx/erp-tienda-api.conf.example`.
2. Certificado: `sudo certbot --nginx -d vps-6055529-x.dattaweb.com`.
3. Recargar: `sudo nginx -t && sudo systemctl reload nginx`.

Desde fuera del VPS:

```bash
curl -s https://vps-6055529-x.dattaweb.com/api/salud
```

---

## 7. Vercel — frontend

1. Importar el repositorio.
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Variable **Production:**

   ```
   VITE_API_BASE_URL=https://vps-6055529-x.dattaweb.com/api
   ```

6. Desplegar.

---

## 8. Migraciones (ventaja de Node directo)

Tras cambios de esquema en el repo:

```bash
./deploy/actualizar-api.sh
```

Equivale a: `git pull` → `npm ci` → `build` → `prisma migrate deploy` → `pm2 reload`.

Migración manual si hace falta:

```bash
cd backend
npm run db:migrate
pm2 reload erp-tienda-api
```

---

## 9. Checklist de humo

- [ ] `GET https://vps-6055529-x.dattaweb.com/api/salud` → OK
- [ ] Login en Vercel sin credenciales precargadas
- [ ] Login `admin` → inicio sin error CORS
- [ ] Navegar menús (productos, clientes, etc.)
- [ ] Cambiar contraseña del administrador
- [ ] `pm2 status` → `online`
- [ ] `docker compose -f docker-compose.prod.yml ps` → postgres healthy

### Errores frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| CORS | `CORS_ORIGENES` no coincide con la URL de Vercel |
| 502 Bad Gateway | PM2 caído (`pm2 logs erp-tienda-api`) |
| ECONNREFUSED DB | Postgres no levantado o `DATABASE_URL` incorrecta |
| Login 401 | No se ejecutó `npm run db:seed` |
| API reinicia sola | Falta RAM — revisar `pm2 logs` y `docker stats` |

---

## 10. Comandos útiles

```bash
# Logs API
pm2 logs erp-tienda-api

# Reinicio manual
pm2 restart erp-tienda-api

# Estado recursos
free -h
docker stats --no-stream

# Backup volumen Postgres (ejemplo)
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U erp ERPTienda > backup-$(date +%F).sql
```

---

## 11. Seguridad antes de pruebas amplias

- [ ] Contraseña de `admin` cambiada
- [ ] `JWT_SECRETO` y `POSTGRES_PASSWORD` fuertes
- [ ] Puerto 5432 solo en `127.0.0.1`
- [ ] API en `HOST=127.0.0.1` (no expuesta sin nginx)
- [ ] Firewall: 22, 80, 443 únicamente

---

## 12. Desarrollo local

Sigue usando `docker compose up -d` (dev) y `dev.sh`.  
`docker-compose.prod.yml` es solo PostgreSQL en producción; la API en dev sigue con `npm run start:dev`.
