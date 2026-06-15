# Despliegue en producción — ERP Tienda

Guía para poner el sistema en producción: **un VPS por cliente** (API + PostgreSQL en cada uno) y frontend en **Cloudflare Pages**.

> **PDF paso a paso:** [DESPLIEGUE.pdf](DESPLIEGUE.pdf)  
> Regenerar: `python3 scripts/generar-guia-despliegue-pdf.py`

## Arquitectura

| | Cliente 1 | Cliente 2 |
|---|-----------|-----------|
| **VPS** | `200.58.99.253` | IP del segundo VPS |
| **Host** | `vps-6055529-x.dattaweb.com` | _Completar_ |
| **En el VPS** | API + PostgreSQL | API + PostgreSQL |
| **SSH (tu PC)** | `erp-vps` ✅ ya funciona | `erp-vps-cliente2` (crear) |
| **Cloudflare** | Proyecto Pages propio | Proyecto Pages propio |

```
[ Cloudflare — Cliente 1 ]  ──►  [ VPS Cliente 1: API + PostgreSQL ]
[ Cloudflare — Cliente 2 ]  ──►  [ VPS Cliente 2: API + PostgreSQL ]
```

## Orden de trabajo

**Completá todo el Cliente 1 antes de empezar el Cliente 2.**

| Fase | Qué hacer |
|------|-----------|
| **A — Cliente 1** | Secciones 1 a 7 |
| **B — Cliente 2** | Sección 8 (solo cuando A esté terminado) |

Estado actual verificado en tu PC:

| Paso Cliente 1 | Estado |
|----------------|--------|
| SSH `erp-vps` | ✅ Funciona (`erp@vps-6055529-x`) |
| UFW (22, 80, 443) | ✅ Activo |
| Fail2ban | ✅ Activo |
| Easypanel + API + Postgres | ⏳ Pendiente |
| Cloudflare Pages | ⏳ Pendiente |

---

# PARTE A — Cliente 1

---

## 1. SSH en tu PC (Fedora)

### 1.1 Conexión actual (ya validada)

En tu máquina el alias configurado es **`erp-vps`**:

```sshconfig
Host erp-vps
    HostName 200.58.99.253
    User erp
    IdentityFile ~/.ssh/id_ed25519
```

Verificar (debe entrar sin pedir contraseña):

```bash
ssh erp-vps
whoami    # erp
hostname  # vps-6055529-x
exit
```

### 1.2 Alias opcional para claridad

Cuando agregues el Cliente 2, podés renombrar o duplicar el alias en `~/.ssh/config`:

```sshconfig
Host erp-vps-cliente1 erp-vps
    HostName 200.58.99.253
    User erp
    IdentityFile ~/.ssh/id_ed25519
```

`erp-vps` y `erp-vps-cliente1` apuntan al mismo servidor. **No hace falta cambiar nada** si `erp-vps` ya te funciona.

### 1.3 Clave SSH (solo si en otra PC)

```bash
ls -la ~/.ssh/id_ed25519.pub
# si no existe:
ssh-keygen -t ed25519 -C "hernan-fedora-erp"
ssh-copy-id erp@200.58.99.253
```

---

## 2. Seguridad en VPS Cliente 1

Conectate con `ssh erp-vps` y verificá. En este servidor **ya está** configurado; solo confirmá:

### 2.1 Firewall (UFW)

```bash
sudo ufw status
```

Debe mostrar **active** con `OpenSSH`, `80/tcp` y `443/tcp`.  
**No** debe estar abierto `5432` al público.

Si falta algo:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2.2 Fail2ban

```bash
sudo systemctl is-active fail2ban
sudo fail2ban-client status sshd
```

Si no está activo:

```bash
sudo cp deploy/fail2ban/jail.local.example /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Referencia `jail.local`:

```ini
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port    = ssh
filter  = sshd
logpath = /var/log/auth.log
maxretry = 4
```

---

## 3. Stack en VPS Cliente 1 (Easypanel: Postgres + API)

```bash
ssh erp-vps
```

### 3.1 Instalar Easypanel (si no está)

```bash
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker erp
# cerrar sesión SSH y volver a entrar

curl -fsSL https://get.easypanel.io | sudo bash
```

Abrí el panel Easypanel en el navegador (puerto que indique la instalación).

### 3.2 PostgreSQL (mismo VPS)

1. **New** → proyecto `erp-tienda`.
2. **+ Service** → **PostgreSQL** → nombre `erp-postgres`.
3. Base **`ERPTienda`**, usuario y contraseña fuertes.
4. **No** publicar puerto 5432 a internet.

### 3.3 API (mismo VPS)

1. **+ Service** → **App** → `erp-api`.
2. GitHub → `hernanXDD/ERPTienda` → rama `main` → carpeta `backend`.
3. Dockerfile en `backend/`, puerto contenedor **3000**.
4. Vincular la app a la red interna para alcanzar `erp-postgres`.

### 3.4 Variables de entorno — Cliente 1

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PUERTO` | `3000` |
| `DATABASE_URL` | `postgresql://USUARIO:PASSWORD@erp-postgres:5432/ERPTienda?schema=public` |
| `JWT_SECRETO` | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGENES` | URL Cloudflare del Cliente 1 (sección 6) |
| `TRUST_PROXY` | `true` |

> `DATABASE_URL` usa el **nombre del servicio** Postgres en Easypanel, no `localhost` ni IP pública.

### 3.5 HTTPS — Cliente 1

1. Servicio `erp-api` → **Domains**.
2. Dominio: `vps-6055529-x.dattaweb.com`.
3. Activar **HTTPS** (Let's Encrypt), proxy al puerto **3000**.

```bash
curl -s https://vps-6055529-x.dattaweb.com/api/salud
```

---

## 4. Semilla de base de datos — Cliente 1 (solo primera vez)

Desde **Easypanel** (igual que en el despliegue anterior), no por SSH:

1. Panel Easypanel → proyecto `erp-tienda` → servicio **`erp-api`**.
2. Pestaña **Console** (o **Terminal** / consola del contenedor).
3. Ejecutar:

```bash
npm run db:seed
```

| Usuario | Contraseña inicial |
|---------|-------------------|
| admin | 12345678 |

Cambiar contraseña en el **primer login**.

---

## 5. Frontend Cloudflare — Cliente 1

El frontend **no** va al VPS.

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Pages** → **Connect to Git**.
2. Repo `ERPTienda`.

| Campo | Valor |
|-------|-------|
| Nombre del proyecto | `erp-cliente1` (o el que prefieras) |
| Production branch | `main` |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| `NODE_VERSION` | `20` |

| Variable | Valor |
|----------|-------|
| `VITE_API_BASE_URL` | `https://vps-6055529-x.dattaweb.com/api` |

---

## 6. Verificación final — Cliente 1

Checklist antes de pasar al Cliente 2:

- [ ] `ssh erp-vps` entra con clave, sin contraseña
- [ ] UFW activo (22, 80, 443; sin 5432 público)
- [ ] Fail2ban activo (`fail2ban-client status sshd`)
- [ ] `curl https://vps-6055529-x.dattaweb.com/api/salud` responde OK
- [ ] Cloudflare Pages desplegado con `VITE_API_BASE_URL` correcto
- [ ] URL de Cloudflare agregada en `CORS_ORIGENES` del VPS + redeploy API
- [ ] Login `admin` / `12345678` → `POST .../inicio-sesion` → **200**
- [ ] Contraseña de `admin` cambiada

Anotá (fuera de Git):

```
Cliente 1 — URL API:        https://vps-6055529-x.dattaweb.com/api
Cliente 1 — URL Cloudflare: ___________________________________________
Cliente 1 — POSTGRES_PASSWORD: ________________________________________
Cliente 1 — JWT_SECRETO:    ___________________________________________
```

---

# PARTE B — Cliente 2

> **Empezá esta parte solo cuando el Cliente 1 esté completo y verificado.**

---

## 7. SSH — preparar tu PC para Cliente 2

La misma clave `~/.ssh/id_ed25519` sirve para ambos VPS.

Agregá en `~/.ssh/config` (sin quitar `erp-vps`):

```sshconfig
Host erp-vps-cliente2
    HostName IP_DEL_VPS_CLIENTE_2
    User erp
    IdentityFile ~/.ssh/id_ed25519
```

```bash
chmod 600 ~/.ssh/config
```

---

## 8. VPS Cliente 2 — configuración inicial

Seguí estos pasos **solo en el VPS Cliente 2** (igual que hiciste la primera vez en Cliente 1).

### 8.1 Primer ingreso como root

```bash
ssh root@IP_DEL_VPS_CLIENTE_2
```

No cierres root hasta confirmar `ssh erp-vps-cliente2` con tu clave.

### 8.2 Sistema, usuario y paquetes

```bash
apt update && apt upgrade -y
adduser erp
usermod -aG sudo erp
apt install -y curl git ufw fail2ban
timedatectl set-timezone America/Argentina/Buenos_Aires
```

### 8.3 Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 8.4 Fail2ban

```bash
sudo cp deploy/fail2ban/jail.local.example /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 8.5 Copiar clave SSH

Desde Fedora:

```bash
ssh-copy-id erp@IP_DEL_VPS_CLIENTE_2
ssh erp-vps-cliente2
```

### 8.6 Endurecer SSH

```bash
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
sudo systemctl restart ssh
```

---

## 9. Stack en VPS Cliente 2 (Easypanel: Postgres + API)

Repetí la **sección 3** en el VPS Cliente 2:

- Proyecto Easypanel (ej. `erp-tienda-cliente2`)
- PostgreSQL `erp-postgres` + API `erp-api`
- `DATABASE_URL` con host `erp-postgres` (mismo VPS)
- `JWT_SECRETO` **distinto** al del Cliente 1
- Dominio HTTPS del VPS Cliente 2

### Semilla (solo primera vez)

En **Easypanel** → proyecto `erp-tienda-cliente2` → servicio **`erp-api`** → **Console**:

```bash
npm run db:seed
```

Usuario inicial: `admin` / `12345678` — cambiar en el primer login.

---

## 10. Frontend Cloudflare — Cliente 2

Segundo proyecto en Pages (misma config de build que Cliente 1):

| Variable | Valor |
|----------|-------|
| `VITE_API_BASE_URL` | `https://HOST_VPS_CLIENTE_2/api` |

Agregar la URL de Cloudflare en `CORS_ORIGENES` del **VPS Cliente 2** y redeploy API.

---

## 11. Verificación final — Cliente 2

- [ ] `ssh erp-vps-cliente2` con clave
- [ ] Fail2ban y UFW activos
- [ ] API + Postgres en el mismo VPS
- [ ] Login funciona en el frontend del Cliente 2
- [ ] No mezcla URLs con el Cliente 1

---

## Errores frecuentes

| Síntoma | Solución |
|---------|----------|
| `ssh erp-vps-cliente1` no resuelve | Usá `erp-vps` (tu alias actual) o agregá el alias en `~/.ssh/config` |
| API no conecta a DB | `DATABASE_URL` con `erp-postgres`, no IP pública |
| Cliente 2 llama API del Cliente 1 | Corregir `VITE_API_BASE_URL` en Pages del Cliente 2 |
| Error CORS | URL exacta del frontend de **ese** cliente en `CORS_ORIGENES` |
| Postgres expuesto | No abrir 5432 en UFW |

---

## Comandos diarios

```bash
ssh erp-vps              # Cliente 1 (alias actual)
ssh erp-vps-cliente2     # Cliente 2 (cuando esté listo)
```

---

## Actualizaciones

```bash
git push origin main
```

Redeploy `erp-api` en cada Easypanel + rebuild automático en cada proyecto Cloudflare.

---

## Desarrollo local

```bash
docker compose up -d
./dev.sh
```

Ver [README.md](README.md).
