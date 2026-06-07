import type { FiltroFechasReporte } from './filtroFechasReporte';
import { estilosBaseReporteCss, claseExportacionPdfReporte } from './estilosReporteCss';
import {
  dibujarPieEnTodasLasPaginasPdf,
  leerDatosPieDesdeDocumento,
} from './piePaginaReporte';

function sanitizarNombreArchivo(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'reporte'
  );
}

/** Nombre de archivo (sin extensión) según título y rango de fechas del filtro activo. */
export function nombreArchivoReportePdf(tituloBase: string, filtro: FiltroFechasReporte): string {
  const base = sanitizarNombreArchivo(tituloBase);
  return `${base}_${filtro.fechaDesde}_${filtro.fechaHasta}`;
}

/** Conversión mm → px (96 dpi) para captura html2canvas al ancho exacto de A4. */
const PX_POR_MM = 96 / 25.4;
const ANCHO_PAGINA_A4_MM = 210;
const ANCHO_PAGINA_A4_PX = Math.round(ANCHO_PAGINA_A4_MM * PX_POR_MM);
const MARGEN_PDF_SUPERIOR_MM = 12;
const MARGEN_PDF_INFERIOR_MM = 24;
const MARGEN_PDF_LATERAL_INTERNO_MM = 10;
const MARGEN_PDF_LATERAL_INTERNO_PX = Math.round(MARGEN_PDF_LATERAL_INTERNO_MM * PX_POR_MM);

const opcionesPdfPorDefecto = (nombreArchivo: string) => ({
  /** Sin márgenes horizontales: el ancho lo define `.rep-doc` a 210 mm. */
  margin: [MARGEN_PDF_SUPERIOR_MM, 0, MARGEN_PDF_INFERIOR_MM, 0] as number[],
  filename: `${sanitizarNombreArchivo(nombreArchivo)}.pdf`,
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: ANCHO_PAGINA_A4_PX,
    width: ANCHO_PAGINA_A4_PX,
  },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  pagebreak: { mode: ['css', 'legacy'] as string[] },
});

function esInstanciaJsPdf(valor: unknown): valor is JsPdfConPaginas {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'output' in valor &&
    typeof (valor as { output: unknown }).output === 'function' &&
    'setPage' in valor &&
    'internal' in valor
  );
}

interface JsPdfConPaginas {
  internal: {
    getNumberOfPages: () => number;
    pageSize: { getWidth: () => number; getHeight: () => number };
  };
  setPage: (pagina: number) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setLineWidth: (ancho: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  setFontSize: (tamano: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  text: (
    texto: string,
    x: number,
    y: number,
    opciones?: { align?: 'left' | 'center' | 'right'; maxWidth?: number },
  ) => void;
  output: (tipo: string) => string | Blob;
}

/**
 * Abre una URL (blob del PDF) en una pestaña nueva. Sin `noopener` en window.open
 * para que el visor del navegador pueda cargar el recurso correctamente.
 */
function abrirUrlPdfEnNuevaPestana(url: string, revocarDespues?: () => void): void {
  let abierto = false;

  const ventana = window.open(url, '_blank');
  if (ventana) abierto = true;

  if (!abierto) {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.target = '_blank';
    enlace.rel = 'noreferrer';
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    abierto = true;
  }

  if (!abierto) {
    throw new Error(
      'El navegador bloqueó la ventana emergente. Permití ventanas emergentes desde este sitio para ver el PDF.'
    );
  }

  if (revocarDespues) {
    window.setTimeout(revocarDespues, 120_000);
  }
}

function prepararClonParaCapturaPdf(clon: HTMLElement): void {
  clon.style.boxSizing = 'border-box';
  clon.style.width = `${ANCHO_PAGINA_A4_PX}px`;
  clon.style.maxWidth = `${ANCHO_PAGINA_A4_PX}px`;
  clon.style.minWidth = `${ANCHO_PAGINA_A4_PX}px`;
  clon.style.margin = '0';
  clon.style.paddingLeft = `${MARGEN_PDF_LATERAL_INTERNO_PX}px`;
  clon.style.paddingRight = `${MARGEN_PDF_LATERAL_INTERNO_PX}px`;
}

export function prepararClonDocumentoA4Pdf(clon: HTMLElement): void {
  clon.style.boxSizing = 'border-box';
  clon.style.width = `${ANCHO_PAGINA_A4_PX}px`;
  clon.style.maxWidth = `${ANCHO_PAGINA_A4_PX}px`;
  clon.style.minWidth = `${ANCHO_PAGINA_A4_PX}px`;
  clon.style.margin = '0';
}

function crearClonAisaldoParaPdf(elementoReporte: HTMLElement): {
  elemento: HTMLElement;
  limpiar: () => void;
} {
  const envoltorio = document.createElement('div');
  envoltorio.setAttribute('aria-hidden', 'true');
  envoltorio.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${ANCHO_PAGINA_A4_PX}px`,
    `max-width:${ANCHO_PAGINA_A4_PX}px`,
    'background:#fff',
    'z-index:-1',
    'pointer-events:none',
    'overflow:visible',
  ].join(';');

  const clon = elementoReporte.cloneNode(true) as HTMLElement;
  envoltorio.appendChild(clon);
  document.body.appendChild(envoltorio);
  prepararClonParaCapturaPdf(clon);

  return {
    elemento: clon,
    limpiar: () => {
      document.body.removeChild(envoltorio);
    },
  };
}

function activarEstilosExportacionPdf(elementoReporte: HTMLElement): () => void {
  elementoReporte.classList.add(claseExportacionPdfReporte);
  void elementoReporte.offsetHeight;
  return () => {
    elementoReporte.classList.remove(claseExportacionPdfReporte);
  };
}

interface OpcionesCapturaPdf {
  prepararClon?: (clon: HTMLElement) => void;
  antesCaptura?: (clon: HTMLElement) => () => void;
  postProcesarPdf?: (pdf: JsPdfConPaginas, clon: HTMLElement) => void;
}

async function capturarElementoComoPdf(
  elementoRaiz: HTMLElement,
  nombreArchivo: string,
  opciones: OpcionesCapturaPdf = {},
): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');

  const { elemento: elementoCaptura, limpiar: limpiarClon } =
    crearClonAisaldoParaPdf(elementoRaiz);

  opciones.prepararClon?.(elementoCaptura);
  const restaurarCaptura = opciones.antesCaptura?.(elementoCaptura);

  let pdf: unknown;
  try {
    pdf = await html2pdf()
      .set(opcionesPdfPorDefecto(nombreArchivo))
      .from(elementoCaptura)
      .toPdf()
      .get('pdf');
  } finally {
    restaurarCaptura?.();
    limpiarClon();
  }

  if (!esInstanciaJsPdf(pdf)) {
    throw new Error('No se pudo generar el archivo PDF.');
  }

  opciones.postProcesarPdf?.(pdf, elementoCaptura);

  const salida = pdf.output('bloburl');
  const urlPdf = typeof salida === 'string' ? salida : URL.createObjectURL(salida);

  const revocar =
    typeof salida === 'string'
      ? undefined
      : () => {
          URL.revokeObjectURL(urlPdf);
        };

  abrirUrlPdfEnNuevaPestana(urlPdf, revocar);
}

/**
 * Genera PDF a partir de HTML en memoria (p. ej. comprobantes) y lo abre en una pestaña.
 */
export async function exportarHtmlRaizComoPdf(
  fragmentoHtml: string,
  selectorDocumento: string,
  nombreArchivo: string,
  opciones: OpcionesCapturaPdf = {},
): Promise<void> {
  const envoltorio = document.createElement('div');
  envoltorio.setAttribute('aria-hidden', 'true');
  envoltorio.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${ANCHO_PAGINA_A4_PX}px`,
    `max-width:${ANCHO_PAGINA_A4_PX}px`,
    'background:#fff',
    'z-index:-1',
    'pointer-events:none',
    'overflow:visible',
  ].join(';');
  envoltorio.innerHTML = fragmentoHtml;
  document.body.appendChild(envoltorio);

  const documento = envoltorio.querySelector(selectorDocumento);
  if (!(documento instanceof HTMLElement)) {
    document.body.removeChild(envoltorio);
    throw new Error('No se encontró el contenido para exportar a PDF.');
  }

  try {
    await capturarElementoComoPdf(documento, nombreArchivo, opciones);
  } finally {
    document.body.removeChild(envoltorio);
  }
}

/**
 * Genera un PDF del nodo `.rep-doc` y lo abre en una nueva pestaña del navegador.
 */
async function generarPdfDesdeElemento(
  elementoReporte: HTMLElement,
  nombreArchivo: string
): Promise<void> {
  const pieDatos = leerDatosPieDesdeDocumento(elementoReporte);

  await capturarElementoComoPdf(elementoReporte, nombreArchivo, {
    prepararClon: prepararClonParaCapturaPdf,
    antesCaptura: (elementoCaptura) => {
      const pieHtml = elementoCaptura.querySelector('.rep-pie-pagina');
      const visibilidadPieOriginal =
        pieHtml instanceof HTMLElement ? pieHtml.style.visibility : '';

      if (pieHtml instanceof HTMLElement) {
        pieHtml.style.visibility = 'hidden';
      }

      const restaurarEstilosExportacion = activarEstilosExportacionPdf(elementoCaptura);

      return () => {
        restaurarEstilosExportacion();
        if (pieHtml instanceof HTMLElement) {
          pieHtml.style.visibility = visibilidadPieOriginal;
        }
      };
    },
    postProcesarPdf: (pdf) => {
      if (pieDatos) {
        dibujarPieEnTodasLasPaginasPdf(pdf, pieDatos);
      }
    },
  });
}

export async function exportarElementoReporteComoPdf(
  elementoReporte: HTMLElement,
  nombreArchivo: string
): Promise<void> {
  await generarPdfDesdeElemento(elementoReporte, nombreArchivo);
}

/**
 * Genera PDF a partir del HTML del reporte (mismo contenido que la vista previa con filtros aplicados).
 */
export async function exportarReporteComoPdf(
  cuerpoHtml: string,
  nombreArchivo: string
): Promise<void> {
  const envoltorio = document.createElement('div');
  envoltorio.setAttribute('aria-hidden', 'true');
  envoltorio.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${ANCHO_PAGINA_A4_PX}px`,
    `max-width:${ANCHO_PAGINA_A4_PX}px`,
    'background:#fff',
    'z-index:-1',
    'pointer-events:none',
    'overflow:visible',
  ].join(';');
  envoltorio.innerHTML = cuerpoHtml;
  document.body.appendChild(envoltorio);

  const documento = envoltorio.querySelector('.rep-doc');
  if (!(documento instanceof HTMLElement)) {
    document.body.removeChild(envoltorio);
    throw new Error('No se encontró el contenido del reporte para exportar.');
  }

  prepararClonParaCapturaPdf(documento);

  try {
    await exportarElementoReporteComoPdf(documento, nombreArchivo);
  } finally {
    document.body.removeChild(envoltorio);
  }
}

/**
 * Genera el PDF con los filtros aplicados y lo abre en una nueva pestaña.
 * Usa el elemento visible de la vista previa o, si no está disponible, el HTML generado.
 */
export async function exportarVistaReporteComoPdf(
  htmlReporte: string,
  nombreArchivo: string,
  contenedorVista?: HTMLElement | null
): Promise<void> {
  const documentoVisible = contenedorVista?.querySelector('.rep-doc');
  if (documentoVisible instanceof HTMLElement) {
    await exportarElementoReporteComoPdf(documentoVisible, nombreArchivo);
    return;
  }

  if (!htmlReporte.trim()) {
    throw new Error('No hay contenido de reporte para exportar.');
  }

  await exportarReporteComoPdf(htmlReporte, nombreArchivo);
}

/** @deprecated Usar exportarVistaReporteComoPdf para abrir el PDF en una nueva pestaña. */
export function abrirImpresionReporte(cuerpoHtml: string, tituloDocumento: string): void {
  const tituloSeguro = tituloDocumento.replace(/</g, '');
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${tituloSeguro}</title>
<style>
body { margin: 0; padding: 1.25rem 1.5rem; background: #fff; }
${estilosBaseReporteCss}
</style>
</head>
<body>
${cuerpoHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, '_blank', 'noopener,noreferrer');
  URL.revokeObjectURL(url);

  if (!ventana) {
    throw new Error(
      'El navegador bloqueó la ventana emergente. Permití ventanas desde este sitio o usá «Exportar PDF».'
    );
  }
}
