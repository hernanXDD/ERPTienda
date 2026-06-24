import html2canvas from 'html2canvas';
import { claseCapturaCuponImagen } from './estilosCuponCss';
import { TARJETA_CUPON_ALTO_MM, TARJETA_CUPON_ANCHO_MM } from './dimensionesTarjetaCupon';
import { sanitizarNombreArchivoCupon, nombreBaseArchivoCupon } from './nombresArchivoCupon';

const PX_POR_MM = 96 / 25.4;
export const ANCHO_CUPON_PX = Math.round(TARJETA_CUPON_ANCHO_MM * PX_POR_MM);
const ALTO_CUPON_PX = Math.round(TARJETA_CUPON_ALTO_MM * PX_POR_MM);

const ESCALA_CAPTURA_CUPON = 2;
const CALIDAD_JPG_CUPON = 0.92;

export interface MontajeCuponEnDom {
  documento: HTMLElement;
  limpiar: () => void;
}

function crearEnvoltorioOffscreenCupon(): HTMLDivElement {
  const envoltorio = document.createElement('div');
  envoltorio.setAttribute('aria-hidden', 'true');
  envoltorio.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${ANCHO_CUPON_PX}px`,
    `height:${ALTO_CUPON_PX}px`,
    'max-width:none',
    'background:#fff',
    'z-index:-1',
    'pointer-events:none',
    'overflow:visible',
  ].join(';');
  return envoltorio;
}

function esperarSiguientePintado(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function esperarImagenesCupon(elemento: HTMLElement): Promise<void> {
  const imagenes = [...elemento.querySelectorAll('img')];
  await Promise.all(
    imagenes.map(
      (imagen) =>
        new Promise<void>((resolve) => {
          if (imagen.complete) {
            resolve();
            return;
          }
          imagen.addEventListener('load', () => resolve(), { once: true });
          imagen.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
}

function obtenerEstilosHermanoCupon(documento: HTMLElement): HTMLStyleElement | null {
  const hermano = documento.previousElementSibling;
  return hermano instanceof HTMLStyleElement ? hermano : null;
}

/** Monta el HTML del cupón fuera de pantalla, listo para captura o PDF. */
export function montarCuponEnDom(cuerpoHtml: string): MontajeCuponEnDom {
  const envoltorio = crearEnvoltorioOffscreenCupon();
  envoltorio.innerHTML = cuerpoHtml;
  document.body.appendChild(envoltorio);

  const documento = envoltorio.querySelector('.rep-doc');
  if (!(documento instanceof HTMLElement)) {
    document.body.removeChild(envoltorio);
    throw new Error('No se encontró el contenido del cupón para exportar.');
  }

  documento.classList.add(claseCapturaCuponImagen);
  void documento.offsetHeight;

  return {
    documento,
    limpiar: () => {
      document.body.removeChild(envoltorio);
    },
  };
}

export async function generarBlobJpgCupon(cuerpoHtml: string): Promise<Blob> {
  if (!cuerpoHtml.trim()) {
    throw new Error('No hay contenido del cupón para generar la imagen.');
  }

  const { documento, limpiar } = montarCuponEnDom(cuerpoHtml);
  const estilos = obtenerEstilosHermanoCupon(documento);

  try {
    await esperarImagenesCupon(documento);
    await esperarSiguientePintado();

    const canvas = await html2canvas(documento, {
      scale: ESCALA_CAPTURA_CUPON,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: ANCHO_CUPON_PX,
      height: ALTO_CUPON_PX,
      windowWidth: ANCHO_CUPON_PX,
      windowHeight: ALTO_CUPON_PX,
      onclone: (documentoClonado, elementoClonado) => {
        if (estilos) {
          documentoClonado.head.appendChild(estilos.cloneNode(true));
        }
        elementoClonado.classList.add(claseCapturaCuponImagen);
      },
    });

    if (canvas.width <= 1 || canvas.height <= 1) {
      throw new Error('La captura del cupón quedó vacía. Intentá de nuevo.');
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (resultado) => {
          if (resultado) resolve(resultado);
          else reject(new Error('No se pudo generar la imagen JPG del cupón.'));
        },
        'image/jpeg',
        CALIDAD_JPG_CUPON,
      );
    });

    return blob;
  } finally {
    limpiar();
  }
}

export function nombreArchivoJpgCupon(numeroCupon: string): string {
  return `${sanitizarNombreArchivoCupon(nombreBaseArchivoCupon(numeroCupon))}.jpg`;
}

export function descargarBlobComoJpg(blob: Blob, numeroCupon: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivoJpgCupon(numeroCupon);
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
