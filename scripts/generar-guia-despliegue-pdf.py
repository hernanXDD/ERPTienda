#!/usr/bin/env python3
"""Genera DESPLIEGUE.pdf — guía paso a paso de despliegue en producción."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "DESPLIEGUE.pdf"

FUENTE = "/usr/share/fonts/google-noto/NotoSans-Regular.ttf"
FUENTE_NEGRITA = "/usr/share/fonts/google-noto/NotoSans-Bold.ttf"
FUENTE_MONO = "/usr/share/fonts/google-noto/NotoSansMono-Regular.ttf"

MARGEN = 18
ANCHO_UTIL = 210 - 2 * MARGEN

# Cliente 2
IP_CLIENTE_2 = "149.50.151.139"
HOST_CLIENTE_2 = "HOST_VPS_2.dattaweb.com"  # completar desde panel DonWeb


class GuiaDesplieguePDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="A4", unit="mm")
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(MARGEN, MARGEN, MARGEN)
        self.add_font("Noto", "", FUENTE)
        self.add_font("Noto", "B", FUENTE_NEGRITA)
        self.add_font("Mono", "", FUENTE_MONO)

    def portada(self) -> None:
        self.add_page()
        self.set_font("Noto", "B", 22)
        self.set_text_color(30, 64, 120)
        self.multi_cell(0, 12, "ERP Tienda", align="C")
        self.ln(4)
        self.set_font("Noto", "B", 16)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 9, "Guia de despliegue en produccion", align="C")
        self.ln(6)
        self.set_font("Noto", "", 11)
        self.set_text_color(80, 80, 80)
        self.multi_cell(
            0,
            6,
            "Dos clientes, dos VPS (API + PostgreSQL cada uno). "
            "Frontend en Cloudflare Pages.",
            align="C",
        )
        self.ln(8)
        self._caja_info(
            [
                "Cliente 1 — LISTO (falta Cloudflare Pages):",
                "  alias SSH: erp-vps  |  IP: 200.58.99.253",
                "  host: vps-6055529-x.dattaweb.com",
                "",
                "Cliente 2 — CONFIGURAR:",
                f"  alias SSH: erp-vps-cliente2  |  IP: {IP_CLIENTE_2}",
                f"  host HTTPS: {HOST_CLIENTE_2} (completar)",
            ]
        )
        self.ln(8)
        self.set_font("Noto", "", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, "Repositorio: github.com/hernanXDD/ERPTienda  |  Rama: main", align="C")

    def indice(self) -> None:
        self.add_page()
        self.titulo_seccion("Indice")
        self.set_font("Noto", "B", 11)
        self.set_text_color(30, 64, 120)
        self.cell(0, 7, "PARTE A — Cliente 1", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Noto", "", 10)
        for item in [
            "1. SSH (erp-vps) — listo",
            "2. Seguridad — listo",
            "3-4. Easypanel + semilla — listo",
            "5. Cloudflare Pages — pendiente",
        ]:
            self.cell(0, 7, f"   {item}", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        self.set_font("Noto", "B", 11)
        self.cell(0, 7, f"PARTE B — Cliente 2 ({IP_CLIENTE_2})", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Noto", "", 10)
        for item in [
            "7. Alias SSH en Fedora",
            "8. Root: sistema, usuario erp, UFW, fail2ban",
            "9. Copiar clave SSH y endurecer SSH",
            "10. Docker + Easypanel",
            "11. PostgreSQL + API + variables",
            "12. HTTPS y semilla (consola Easypanel)",
            "13. Cloudflare Pages + CORS",
            "14. Verificacion final",
        ]:
            self.cell(0, 7, f"   {item}", new_x="LMARGIN", new_y="NEXT")

    def titulo_seccion(self, texto: str) -> None:
        self.ln(2)
        self.set_font("Noto", "B", 14)
        self.set_text_color(30, 64, 120)
        self.set_x(MARGEN)
        self.multi_cell(ANCHO_UTIL, 8, texto)
        self.set_draw_color(30, 64, 120)
        self.set_line_width(0.4)
        y = self.get_y()
        self.line(MARGEN, y, MARGEN + ANCHO_UTIL, y)
        self.ln(4)

    def parte(self, texto: str) -> None:
        self.add_page()
        self.set_font("Noto", "B", 16)
        self.set_text_color(30, 64, 120)
        self.set_x(MARGEN)
        self.multi_cell(ANCHO_UTIL, 10, texto, align="C")
        self.ln(4)

    def subtitulo(self, texto: str) -> None:
        self.ln(2)
        self.set_font("Noto", "B", 11)
        self.set_text_color(50, 50, 50)
        self.set_x(MARGEN)
        self.multi_cell(ANCHO_UTIL, 6, texto)
        self.ln(1)

    def parrafo(self, texto: str) -> None:
        self.set_font("Noto", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_x(MARGEN)
        self.multi_cell(ANCHO_UTIL, 5.5, texto)
        self.ln(1)

    def lista(self, items: list[str]) -> None:
        self.set_font("Noto", "", 10)
        self.set_text_color(40, 40, 40)
        for item in items:
            self.set_x(MARGEN)
            self.multi_cell(ANCHO_UTIL, 5.5, f"- {item}")
        self.ln(1)

    def nota(self, texto: str) -> None:
        if self.get_y() > 250:
            self.add_page()
        self.set_fill_color(255, 248, 220)
        self.set_draw_color(220, 180, 80)
        self.set_font("Noto", "", 9)
        self.set_text_color(90, 70, 20)
        self.set_x(MARGEN)
        self.multi_cell(ANCHO_UTIL, 5, f"  Nota: {texto}", border=1, fill=True)
        self.ln(2)

    def codigo(self, lineas: str) -> None:
        lineas_lista = lineas.strip("\n").split("\n")
        alto = 4.2 * len(lineas_lista) + 4
        if self.get_y() + alto > 275:
            self.add_page()
        x = MARGEN
        y = self.get_y()
        self.set_fill_color(245, 247, 250)
        self.set_draw_color(200, 205, 215)
        self.rect(x, y, ANCHO_UTIL, alto, style="DF")
        self.set_font("Mono", "", 8.5)
        self.set_text_color(25, 35, 55)
        for linea in lineas_lista:
            self.set_x(x + 3)
            self.cell(ANCHO_UTIL - 6, 4.2, linea, new_x="LMARGIN", new_y="NEXT")
        self.set_y(y + alto + 2)

    def tabla_simple(self, filas: list[tuple[str, str]]) -> None:
        col1 = 52
        col2 = ANCHO_UTIL - col1
        self.set_font("Noto", "B", 9)
        self.set_fill_color(230, 236, 245)
        self.set_text_color(30, 64, 120)
        self.set_x(MARGEN)
        self.cell(col1, 7, "Campo", border=1, fill=True)
        self.cell(col2, 7, "Valor", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Noto", "", 9)
        self.set_text_color(40, 40, 40)
        for campo, valor in filas:
            y0 = self.get_y()
            self.set_x(MARGEN)
            self.multi_cell(col1, 7, campo, border=1)
            y1 = self.get_y()
            self.set_xy(MARGEN + col1, y0)
            self.multi_cell(col2, 7, valor, border=1)
            self.set_y(max(y1, self.get_y()))
        self.ln(2)

    def _caja_info(self, lineas: list[str]) -> None:
        y = self.get_y()
        alto = 5.5 * len(lineas) + 6
        self.set_fill_color(240, 245, 252)
        self.set_draw_color(180, 195, 220)
        self.rect(MARGEN, y, ANCHO_UTIL, alto, style="DF")
        self.set_xy(MARGEN + 4, y + 3)
        self.set_font("Noto", "", 10)
        self.set_text_color(40, 40, 40)
        for linea in lineas:
            self.set_x(MARGEN + 4)
            self.cell(0, 5.5, linea, new_x="LMARGIN", new_y="NEXT")
        self.set_y(y + alto + 2)


def generar_parte_a(pdf: GuiaDesplieguePDF) -> None:
    pdf.parte("PARTE A — Cliente 1 (casi listo)")
    pdf.parrafo("Stack en VPS listo. Solo falta crear el proyecto en Cloudflare Pages.")

    pdf.titulo_seccion("5. Cloudflare Pages — Cliente 1 (pendiente)")
    pdf.parrafo("En dash.cloudflare.com -> Workers & Pages -> Pages -> Connect to Git:")
    pdf.tabla_simple(
        [
            ("Nombre proyecto", "erp-cliente1"),
            ("Production branch", "main"),
            ("Root directory", "frontend"),
            ("Build command", "npm run build"),
            ("Build output", "dist"),
            ("NODE_VERSION", "20"),
            ("VITE_API_BASE_URL", "https://vps-6055529-x.dattaweb.com/api"),
        ]
    )
    pdf.lista(
        [
            "Deploy y copiar URL (ej. https://erp-cliente1.pages.dev).",
            "Agregar URL en CORS_ORIGENES del VPS Cliente 1.",
            "Redeploy erp-api en Easypanel.",
            "Probar login admin / 12345678.",
        ]
    )


def generar_parte_b(pdf: GuiaDesplieguePDF) -> None:
    ip = IP_CLIENTE_2
    host = HOST_CLIENTE_2

    pdf.parte(f"PARTE B — Cliente 2 ({ip})")
    pdf.parrafo(
        "Ejecutar cada comando en orden. No cerrar sesion root hasta "
        "confirmar ssh erp-vps-cliente2 con clave."
    )
    pdf.nota(f"Anotar del panel DonWeb el hostname del VPS 2 (reemplazar {host}).")

    # --- 7 ---
    pdf.titulo_seccion("7. En Fedora: alias SSH")
    pdf.codigo("nano ~/.ssh/config")
    pdf.parrafo("Agregar al final (sin borrar erp-vps del Cliente 1):")
    pdf.codigo(
        f"""Host erp-vps-cliente2
    HostName {ip}
    User erp
    IdentityFile ~/.ssh/id_ed25519"""
    )
    pdf.codigo("chmod 600 ~/.ssh/config")

    # --- 8 ---
    pdf.titulo_seccion("8. Primer ingreso como root")
    pdf.codigo(f"ssh root@{ip}")
    pdf.parrafo("Escribir yes al fingerprint. Password de root desde DonWeb.")

    pdf.subtitulo("8.1 Actualizar sistema")
    pdf.codigo("apt update && apt upgrade -y")

    pdf.subtitulo("8.2 Crear usuario erp")
    pdf.codigo("adduser erp")
    pdf.codigo("usermod -aG sudo erp")

    pdf.subtitulo("8.3 Paquetes y zona horaria")
    pdf.codigo("apt install -y curl git ufw fail2ban")
    pdf.codigo("timedatectl set-timezone America/Argentina/Buenos_Aires")

    pdf.subtitulo("8.4 Firewall UFW (comando por comando)")
    pdf.codigo("ufw default deny incoming")
    pdf.codigo("ufw default allow outgoing")
    pdf.codigo("ufw allow OpenSSH")
    pdf.codigo("ufw allow 80/tcp")
    pdf.codigo("ufw allow 443/tcp")
    pdf.codigo("ufw enable")
    pdf.codigo("ufw status")
    pdf.nota("NO abrir puerto 5432. Postgres queda solo en red Docker.")

    pdf.subtitulo("8.5 Fail2ban")
    pdf.codigo("nano /etc/fail2ban/jail.local")
    pdf.codigo(
        """[DEFAULT]
bantime=1h  findtime=10m  maxretry=5  banaction=ufw
[sshd]
enabled=true  port=ssh  filter=sshd
logpath=/var/log/auth.log  maxretry=4"""
    )
    pdf.codigo("systemctl enable fail2ban")
    pdf.codigo("systemctl start fail2ban")
    pdf.codigo("fail2ban-client status sshd")

    # --- 9 ---
    pdf.add_page()
    pdf.titulo_seccion("9. Copiar clave SSH (desde Fedora)")
    pdf.parrafo("Salir del VPS si seguis como root: exit")
    pdf.codigo(f"ssh-copy-id erp@{ip}")
    pdf.codigo("ssh erp-vps-cliente2")
    pdf.codigo("whoami")
    pdf.codigo("hostname")
    pdf.parrafo("Debe entrar sin pedir password.")

    pdf.titulo_seccion("10. Endurecer SSH (en VPS como erp)")
    pdf.codigo("sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak")
    pdf.codigo("sudo nano /etc/ssh/sshd_config")
    pdf.codigo(
        """PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes"""
    )
    pdf.codigo("sudo systemctl restart ssh")
    pdf.parrafo("Probar en otra terminal (sin cerrar la actual):")
    pdf.codigo(f"ssh root@{ip}          # debe FALLAR")
    pdf.codigo("ssh erp-vps-cliente2   # debe ENTRAR con clave")

    # --- 10 Easypanel ---
    pdf.titulo_seccion("11. Docker + Easypanel")
    pdf.codigo("sudo apt install -y docker.io docker-compose-plugin")
    pdf.codigo("sudo usermod -aG docker erp")
    pdf.codigo("exit")
    pdf.codigo("ssh erp-vps-cliente2")
    pdf.codigo("curl -fsSL https://get.easypanel.io | sudo bash")
    pdf.parrafo("Abrir panel Easypanel en navegador y crear usuario admin.")

    pdf.titulo_seccion("12. PostgreSQL en Easypanel (mismo VPS)")
    pdf.lista(
        [
            "New -> proyecto erp-tienda-cliente2",
            "+ Service -> PostgreSQL -> nombre erp-postgres",
            "Base ERPTienda, usuario y password fuertes",
            "NO publicar puerto 5432 a internet",
        ]
    )

    pdf.titulo_seccion("13. API en Easypanel (mismo VPS)")
    pdf.lista(
        [
            "+ Service -> App -> erp-api",
            "GitHub hernanXDD/ERPTienda, rama main, carpeta backend",
            "Dockerfile backend/, puerto contenedor 3000",
            "Vincular red interna hacia erp-postgres",
        ]
    )

    pdf.subtitulo("13.1 Generar JWT (distinto al Cliente 1)")
    pdf.codigo("openssl rand -base64 48")

    pdf.subtitulo("13.2 Variables de entorno en Easypanel")
    pdf.tabla_simple(
        [
            ("NODE_ENV", "production"),
            ("HOST", "0.0.0.0"),
            ("PUERTO", "3000"),
            ("DATABASE_URL", "postgresql://USER:PASS@erp-postgres:5432/ERPTienda"),
            ("JWT_SECRETO", "(salida de openssl)"),
            ("JWT_EXPIRES_IN", "8h"),
            ("CORS_ORIGENES", "(URL Cloudflare paso 15)"),
            ("TRUST_PROXY", "true"),
        ]
    )
    pdf.nota("DATABASE_URL usa erp-postgres, NO la IP publica.")

    pdf.subtitulo("13.3 HTTPS")
    pdf.lista(
        [
            f"erp-api -> Domains -> {host}",
            "Activar HTTPS Let's Encrypt, proxy puerto 3000",
        ]
    )
    pdf.codigo(f"curl -s https://{host}/api/salud")

    # --- semilla ---
    pdf.titulo_seccion("14. Semilla de base de datos (Easypanel)")
    pdf.parrafo("Igual que en Cliente 1: desde el panel, no por SSH.")
    pdf.lista(
        [
            "Easypanel -> proyecto erp-tienda-cliente2 -> servicio erp-api",
            "Pestaña Console (o Terminal del contenedor)",
            "Ejecutar el comando siguiente:",
        ]
    )
    pdf.codigo("npm run db:seed")
    pdf.parrafo("Login inicial: admin / 12345678 — cambiar en primer acceso.")

    # --- cloudflare ---
    pdf.add_page()
    pdf.titulo_seccion("15. Cloudflare Pages — Cliente 2")
    pdf.parrafo("dash.cloudflare.com -> Pages -> Create project -> Connect to Git")
    pdf.tabla_simple(
        [
            ("Nombre", "erp-cliente2"),
            ("Root directory", "frontend"),
            ("Build command", "npm run build"),
            ("Output", "dist"),
            ("NODE_VERSION", "20"),
            ("VITE_API_BASE_URL", f"https://{host}/api"),
        ]
    )

    pdf.titulo_seccion("16. CORS en VPS Cliente 2")
    pdf.parrafo("Tras el deploy, copiar URL de Cloudflare (ej. https://erp-cliente2.pages.dev)")
    pdf.codigo("CORS_ORIGENES=https://erp-cliente2.pages.dev")
    pdf.parrafo("Pegar en variables de erp-api en Easypanel y redeploy.")

    pdf.titulo_seccion("17. Verificacion final Cliente 2")
    pdf.codigo("ssh erp-vps-cliente2")
    pdf.codigo("sudo ufw status")
    pdf.codigo("sudo fail2ban-client status sshd")
    pdf.codigo(f"curl -s https://{host}/api/salud")
    pdf.lista(
        [
            "[ ] ssh erp-vps-cliente2 sin password",
            "[ ] UFW y fail2ban activos",
            "[ ] API + Postgres en mismo VPS",
            "[ ] Cloudflare apunta a API del Cliente 2",
            "[ ] Login admin OK (no llama al Cliente 1)",
            "[ ] Password admin cambiada",
        ]
    )

    pdf.subtitulo("Comandos diarios")
    pdf.codigo("ssh erp-vps              # Cliente 1\nssh erp-vps-cliente2     # Cliente 2")


def main() -> None:
    pdf = GuiaDesplieguePDF()
    pdf.portada()
    pdf.indice()
    generar_parte_a(pdf)
    generar_parte_b(pdf)
    pdf.output(str(SALIDA))
    print(f"PDF generado: {SALIDA}")


if __name__ == "__main__":
    main()
