#!/usr/bin/env python3
"""Genera DESPLIEGUE-VPS-PASO-A-PASO.pdf con LibreOffice (guía local, no se sube a Git)."""

import shutil
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
HTML = Path(__file__).resolve().parent / "guia-despliegue-contenido.html"
SALIDA = RAIZ / "DESPLIEGUE-VPS-PASO-A-PASO.pdf"


def generar() -> None:
    if not HTML.is_file():
        raise FileNotFoundError(f"No se encontró {HTML}")

    libreoffice = shutil.which("libreoffice") or shutil.which("soffice")
    if not libreoffice:
        raise RuntimeError("Instalá LibreOffice: sudo dnf install -y libreoffice")

    if SALIDA.exists():
        SALIDA.unlink()

    resultado = subprocess.run(
        [
            libreoffice,
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(RAIZ),
            str(HTML),
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    if resultado.returncode != 0:
        raise RuntimeError(resultado.stderr or resultado.stdout or "Error al convertir a PDF")

    generado = RAIZ / "guia-despliegue-contenido.pdf"
    if generado.exists():
        generado.rename(SALIDA)
    elif not SALIDA.exists():
        raise FileNotFoundError("LibreOffice no generó el PDF esperado")

    print(f"Generado: {SALIDA}")


if __name__ == "__main__":
    generar()
