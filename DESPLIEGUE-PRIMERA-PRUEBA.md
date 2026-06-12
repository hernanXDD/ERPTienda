# Primera prueba en producción — ERP Tienda

Guía paso a paso para el **primer despliegue de prueba** en el negocio.

Orden: **Git → Vercel (frontend) → Easypanel en el VPS (PostgreSQL + API + HTTPS)**.

**PDF para imprimir / leer en el VPS:** generar con `python3 scripts/generar-guia-despliegue-pdf.py` → queda `DESPLIEGUE-VPS.pdf` (un solo archivo con todo el despliegue del servidor).

---

## Estado del despliegue (última sesión)

| Fase | Estado | Notas |
|------|--------|-------|
| 1 — Git | ✅ Hecho | Repo: `https://github.com/hernanXDD/ERPTienda` (rama `main`) |
| 2 — Vercel | ✅ Hecho | Proyecto **merakii** — `https://merakii-eight.vercel.app` |
| 3–7 — VPS (Easypanel) | ⏳ Pendiente | **Retomar acá mañana** |
| 8 — Login end-to-end | ⏳ Pendiente | Depende de API en Easypanel |

### Servidor

| Dato | Valor |
|------|-------|
| SO | **Ubuntu 24.04** |
| Panel | **Easypanel** (Docker + proxy + HTTPS) |
| IP | `200.58.99.253` |
| Host | `vps-6055529-x.dattaweb.com` |

### URLs confirmadas

| Uso | URL |
|-----|-----|
| **Frontend producción** | https://merakii-eight.vercel.app |
| **Preview (ejemplo)** | https://merakii-elogwf7fs-ruffos-team.vercel.app |
| **API pública** | https://vps-6055529-x.dattaweb.com/api |
| **Panel Easypanel** | (la URL que uses en DonWeb — suele ser `http://IP:3000` o dominio propio) |

### Vercel — variable configurada

| Nombre | Valor | Alcance |
|--------|-------|---------|
| `VITE_API_BASE_URL` | `https://vps-6055529-x.dattaweb.com/api` | Production and Preview |

> `VITE_API_BASE_URL` apunta al **VPS** (API), no a `merakii-eight.vercel.app`. Tras cambiarla: **Redeploy** en Vercel.

### Cómo verificar en el navegador (F12 → Red)

| Filtro | Qué ves | Significado |
|--------|---------|-------------|
| **Todo** | `GET merakii-eight.vercel.app/...` → 200 | Frontend OK ✅ |
| **XHR** | `POST vps-6055529-x.dattaweb.com/.../inicio-sesion` | Llama a la API ✅ |
| **XHR** | `POST tu-url-de-vercel.vercel.app/...` | Variable mal — Redeploy ❌ |
| **XHR** | POST al VPS + candado/OPTIONS fallido | API no desplegada o HTTPS pendiente en Easypanel ⏳ |
| **XHR** | POST al VPS → 200 | Login OK ✅ |

---

## Retomar mañana — checklist (orden completo)

1. **Fedora:** crear clave SSH (sección «Preparar SSH en Fedora»).
2. **VPS:** primer ingreso como **root** (contraseña del panel DonWeb).
3. **VPS:** configuración inicial — actualizar sistema, crear usuario `erp`, firewall.
4. **Fedora:** copiar clave SSH al usuario `erp` y probar conexión.
5. **VPS:** deshabilitar login **root** por SSH y reforzar `sshd`.
6. **Easypanel:** verificar panel o instalar si falta.
7. Crear proyecto **erp-tienda**.
4. Servicio **PostgreSQL** (base `ERPTienda`).
5. Servicio **App** → repo GitHub, carpeta `backend`, **Dockerfile**.
6. Variables de entorno (`DATABASE_URL`, `JWT_SECRETO`, `CORS_ORIGENES`, etc.).
7. Dominio `vps-6055529-x.dattaweb.com` + HTTPS (Easypanel / Let's Encrypt).
8. **Deploy** de la app.
9. **Semilla** una sola vez (`npm run db:seed`).
10. Probar: `curl https://vps-6055529-x.dattaweb.com/api/salud`
11. Login en https://merakii-eight.vercel.app (`admin` / `12345678`)

Datos que faltan anotar:

```
URL panel Easypanel:  _______________________________________________
POSTGRES_PASSWORD:    _______________________________________________
JWT_SECRETO:          _______________________________________________
Nombre servicio PG:   erp-postgres  (o el que elijas en Easypanel)
```

---

## Resumen de arquitectura

| Componente | Dónde | Cómo |
|------------|-------|------|
| Frontend (Vue) | Vercel | Build automático desde Git |
| PostgreSQL | VPS — Easypanel | Servicio Postgres (Docker) |
| API (NestJS) | VPS — Easypanel | App desde Git + `backend/Dockerfile` |
| HTTPS / proxy | VPS — Easypanel | Traefik integrado (no nginx manual) |

Easypanel en **Ubuntu 24.04** gestiona contenedores, dominios, certificados SSL y variables de entorno desde la interfaz web.

RAM orientativa (2 GB VPS):

| Proceso | Nota |
|---------|------|
| Easypanel + Traefik | ~300–400 MB |
| PostgreSQL | ~300–512 MB |
| API NestJS | ~300–450 MB |

---

## Datos del proyecto (referencia)

```
Repositorio Git:       https://github.com/hernanXDD/ERPTienda
URL producción:        https://merakii-eight.vercel.app
VITE_API_BASE_URL:     https://vps-6055529-x.dattaweb.com/api
CORS_ORIGENES:         https://merakii-eight.vercel.app
Dockerfile API:        backend/Dockerfile
```

---

## Fase 1 — Git ✅

```bash
git add -A && git commit -m "mensaje" && git push origin main
```

Vercel redeploya solo. En Easypanel podés activar **auto-deploy** al push en `main`.

---

## Fase 2 — Vercel ✅

| Campo | Valor |
|-------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| `VITE_API_BASE_URL` | `https://vps-6055529-x.dattaweb.com/api` |

---

## Preparar SSH en Fedora (tu PC)

Hacelo **antes** del primer ingreso al VPS.

### 1. Cliente SSH

```bash
ssh -V
# si falta:
sudo dnf install -y openssh-clients
```

### 2. Crear clave (primera vez)

```bash
ls -la ~/.ssh/id_ed25519.pub
ssh-keygen -t ed25519 -C "hernan-fedora-erp"
cat ~/.ssh/id_ed25519.pub
```

| Archivo | Uso |
|---------|-----|
| `~/.ssh/id_ed25519` | Privada — no compartir |
| `~/.ssh/id_ed25519.pub` | Pública — copiar al VPS |

### 3. (Opcional) `~/.ssh/config`

```
Host erp-vps
    HostName 200.58.99.253
    User erp
    IdentityFile ~/.ssh/id_ed25519
```

```bash
chmod 600 ~/.ssh/config
```

---

## Primer ingreso al VPS como root

La contraseña de **root** la obtenés del panel DonWeb al activar el VPS.

Desde **Fedora**:

```bash
ssh root@200.58.99.253
# o
ssh root@vps-6055529-x.dattaweb.com
```

- Si pregunta fingerprint: escribí `yes`.
- La contraseña **no se ve** al tipear (es normal).

> **Importante:** no cierres esta sesión root hasta confirmar que podés entrar con el usuario `erp` y su clave SSH (pasos siguientes).

---

## Configuración inicial del servidor (Ubuntu 24.04)

Ejecutá en el VPS **como root** (o con `sudo` una vez creado `erp`).

### 1. Actualizar el sistema

```bash
apt update && apt upgrade -y
```

### 2. Crear usuario de trabajo con sudo

```bash
adduser erp
usermod -aG sudo erp
```

Completá nombre y contraseña del usuario `erp` (distinta a la de root).

Verificar sudo:

```bash
su - erp
sudo whoami
# debe imprimir: root
exit
```

### 3. Paquetes básicos

```bash
apt install -y curl git ufw fail2ban
```

### 4. Zona horaria (Argentina)

```bash
timedatectl set-timezone America/Argentina/Buenos_Aires
timedatectl
```

### 5. Firewall (solo 22, 80, 443)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

No abras **5432** (PostgreSQL) ni **3000** al exterior.

### 6. Fail2ban (protección SSH)

```bash
systemctl enable fail2ban
systemctl start fail2ban
```

---

## Copiar clave SSH al usuario erp

Desde **Fedora** (con la sesión root del VPS aún usable por si algo falla):

```bash
ssh-copy-id erp@200.58.99.253
```

Alternativa manual:

```bash
ssh erp@200.58.99.253 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
cat ~/.ssh/id_ed25519.pub | ssh erp@200.58.99.253 \
  "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Probar en una **terminal nueva** (sin cerrar root):

```bash
ssh erp@200.58.99.253
# o
ssh erp-vps
```

Si entrás con clave sin pedir contraseña de `erp`, seguí al paso de seguridad SSH.

---

## Deshabilitar acceso root por SSH (seguridad)

Solo cuando **confirmaste** que `ssh erp@200.58.99.253` funciona con tu clave.

En el VPS (como root o `sudo`):

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo nano /etc/ssh/sshd_config
```

Asegurá estas líneas (descomentar o agregar):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Guardar y reiniciar SSH (Ubuntu 24.04):

```bash
sudo systemctl restart ssh
```

Probar desde Fedora **sin cerrar la sesión actual**:

```bash
ssh root@200.58.99.253
# debe fallar — correcto

ssh erp@200.58.99.253
# debe entrar con clave — correcto
```

Si `erp` no entra, **no reinicies** hasta corregir: restaurá el backup con la sesión que sigue abierta:

```bash
sudo cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> A partir de acá usá siempre `ssh erp@200.58.99.253` (o `ssh erp-vps`). Root solo por consola del panel DonWeb en emergencia.

---

## Easypanel — verificar o instalar

Si DonWeb ya instaló Easypanel, abrí la URL del panel en el navegador.

Si no está instalado, como `erp` con sudo:

```bash
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker erp
# cerrar sesión y volver a entrar como erp para usar docker sin sudo

curl -fsSL https://get.easypanel.io | sudo bash
```

Documentación: [easypanel.io](https://easypanel.io/)

> Easypanel gestiona Docker, proxy y HTTPS. No hace falta PM2 ni nginx manual.

---

## Fase 3 — Easypanel: proyecto ⏳

1. Abrí el **panel Easypanel** en el navegador (instalación previa en sección «Easypanel — verificar o instalar»).
2. **New** → nombre del proyecto: `erp-tienda` → **Create**.

---

## Fase 4 — Easypanel: PostgreSQL ⏳

1. En el proyecto → **+ Service** → **PostgreSQL**.
2. Nombre sugerido: `erp-postgres`.
3. Definir usuario, contraseña y base **`ERPTienda`**.
4. **Create** y esperar que quede **Running**.

Anotá la **cadena de conexión interna** que muestra Easypanel (host = nombre del servicio, ej. `erp-postgres`):

```env
postgresql://USUARIO:PASSWORD@erp-postgres:5432/ERPTienda?schema=public
```

Esa URL va en `DATABASE_URL` de la app (red interna Docker — no uses `127.0.0.1`).

---

## Fase 5 — Easypanel: App (API NestJS) ⏳

1. **+ Service** → **App**.
2. Nombre sugerido: `erp-api`.

### Source (Git)

| Campo | Valor |
|-------|-------|
| Origen | GitHub |
| Repositorio | `hernanXDD/ERPTienda` |
| Rama | `main` |
| **Root / carpeta** | `backend` |

Conectá la cuenta de GitHub si Easypanel lo pide.

### Build

| Campo | Valor |
|-------|-------|
| Método | **Dockerfile** |
| Ruta Dockerfile | `Dockerfile` (relativa a `backend/`) |

El repo incluye `backend/Dockerfile`: compila NestJS, ejecuta `prisma migrate deploy` al arrancar.

### Puerto

| Campo | Valor |
|-------|-------|
| Puerto del contenedor | `3000` |

### Environment (variables)

En la pestaña **Environment** de la app:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PUERTO` | `3000` |
| `DATABASE_URL` | Cadena interna de PostgreSQL (Fase 4) |
| `JWT_SECRETO` | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGENES` | `https://merakii-eight.vercel.app` |
| `TRUST_PROXY` | `true` |

Con preview opcional:

```env
CORS_ORIGENES=https://merakii-eight.vercel.app,https://merakii-elogwf7fs-ruffos-team.vercel.app
```

Guardar y **Deploy**.

---

## Fase 6 — Easypanel: dominio y HTTPS ⏳

1. En el servicio **erp-api** → pestaña **Domains**.
2. Agregar: `vps-6055529-x.dattaweb.com`.
3. Activar **HTTPS** (Let's Encrypt — lo gestiona Easypanel / Traefik).
4. El proxy debe apuntar al puerto **3000** de la app.

Comprobar desde tu PC:

```bash
curl -s https://vps-6055529-x.dattaweb.com/api/salud
```

Respuesta esperada: JSON con estado OK.

> Sin HTTPS activo verás **candado tachado** en el navegador y fallará el `OPTIONS` (CORS).

---

## Fase 7 — Semilla (solo primera vez) ⏳

Crea el usuario `admin` y datos iniciales (motivos de stock, estados de facturación).

**Opción A — Terminal Easypanel:** en el servicio `erp-api` → **Console** / terminal:

```bash
npm run db:seed
```

**Opción B — SSH al VPS** (si tenés el contenedor accesible):

```bash
docker ps   # identificar contenedor de erp-api
docker exec -it NOMBRE_CONTENEDOR npm run db:seed
```

| Usuario | Contraseña inicial |
|---------|-------------------|
| admin | 12345678 |

Cambiar contraseña en el **primer login**.

---

## Fase 8 — Probar login ⏳

1. https://merakii-eight.vercel.app
2. F12 → Red → **XHR**
3. Login `admin` / `12345678`
4. `POST .../api/autenticacion/inicio-sesion` → **200**
5. Cambio de contraseña + datos del negocio

Si hay CORS con la API arriba: revisar `CORS_ORIGENES` en Easypanel → **Deploy** de nuevo.

---

## Actualizaciones futuras

1. `git push origin main`
2. En Easypanel: redeploy automático (si activaste auto-deploy) o botón **Deploy** manual.
3. El Dockerfile ya corre `prisma migrate deploy` en cada arranque.

---

## Errores frecuentes

| Síntoma | Causa | Qué hacer |
|---------|-------|-----------|
| Peticiones a dominio incorrecto | `VITE_API_BASE_URL` mal | Corregir en Vercel + Redeploy |
| Candado tachado + OPTIONS fallido | HTTPS no activo en Easypanel | Dominio + SSL en servicio app |
| Error CORS con POST al VPS | `CORS_ORIGENES` mal | URL exacta de Vercel + Redeploy app |
| 502 / Bad Gateway | App caída o build fallido | Logs del servicio en Easypanel |
| Error de base de datos | `DATABASE_URL` incorrecta | Usar host interno `erp-postgres`, no `127.0.0.1` |
| Login 401 | Sin semilla | `npm run db:seed` una vez |
| Contenedor se reinicia | Poca RAM (2 GB) | Revisar logs; reducir servicios activos |

---

## Comandos útiles

**Easypanel (interfaz web):** logs, restart y variables de cada servicio.

**SSH (opcional):**

```bash
ssh USUARIO@200.58.99.253
docker ps
docker stats --no-stream
free -h
```

**Backup Postgres:** desde Easypanel (si ofrece backup) o `pg_dump` vía consola del servicio PostgreSQL.

---

## Seguridad mínima

- Cambiar contraseña de `admin` en el primer login.
- `JWT_SECRETO` y contraseña de Postgres fuertes.
- No exponer Postgres a internet (solo red interna Easypanel).
- Firewall VPS: 22, 80, 443.
- Backup antes de cargar datos reales.

---

## Desarrollo local

```bash
docker compose up -d
./dev.sh
```

---

## Anexo — Despliegue manual sin Easypanel

Si en el futuro preferís **PM2 + nginx** en lugar de Easypanel, los scripts siguen en `deploy/` (`instalar-api.sh`, `actualizar-api.sh`, `nginx/`). Ese flujo usa `docker-compose.prod.yml` solo para Postgres y `HOST=127.0.0.1` en `backend/.env`.

**En tu servidor actual (Easypanel en Ubuntu 24.04) usá las fases 3–7 de Easypanel, no el anexo.**
