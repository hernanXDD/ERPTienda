import type { FiltroFechasReporte } from './filtroFechasReporte';
import { claseExportacionPdfReporte } from './estilosReporteCss';
import {
  dibujarPieEnTodasLasPaginasPdf,
  leerDatosPieDesdeDocumento,
} from './piePaginaReporte';

const ID_ESTILOS_VISTA_PREVIA = 'rep-vista-previa-estilos';
const SELECTOR_DOCUMENTO_REPORTE = '.rep-doc';

export interface OpcionesAperturaPdf {
  /** Ventana abierta en el mismo tick del clic (evita bloqueo de popups tras awaits). */
  ventanaDestino?: Window | null;
}

/**
 * Reservá una pestaña en el instante del clic del usuario, antes de cualquier `await`.
 * Pasala luego a las funciones de exportación PDF.
 */
export function reservarVentanaPdfParaExportacion(): Window | null {
  try {
    return window.open('about:blank', '_blank');
  } catch {
    return null;
  }
}

function cerrarVentanaPdf(ventana: Window | null | undefined): void {
  if (ventana && !ventana.closed) {
    try {
      ventana.close();
    } catch {
      /* ignorar */
    }
  }
}

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

function crearEnvoltorioOffscreenPdf(): HTMLDivElement {
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
  return envoltorio;
}

function resolverDocumentoEnRaiz(raiz: HTMLElement, selector: string): HTMLElement {
  if (raiz.matches(selector)) return raiz;
  const encontrado = raiz.querySelector(selector);
  if (!(encontrado instanceof HTMLElement)) {
    throw new Error('No se encontró el contenido para exportar a PDF.');
  }
  return encontrado;
}

function inyectarEstilosReporteDesdeHead(contenedor: HTMLElement): void {
  const hoja = document.getElementById(ID_ESTILOS_VISTA_PREVIA);
  if (!hoja?.textContent?.trim()) return;
  const estilo = document.createElement('style');
  estilo.textContent = hoja.textContent;
  contenedor.appendChild(estilo);
}

/** Incluye el bloque `<style>` hermano o los estilos de vista previa para que html2canvas renderice bien. */
function armarRaizCapturaConEstilos(elementoDocumento: HTMLElement): HTMLElement {
  const raiz = document.createElement('div');
  const estiloHermano = elementoDocumento.previousElementSibling;
  if (estiloHermano instanceof HTMLStyleElement) {
    raiz.appendChild(estiloHermano.cloneNode(true));
  } else {
    inyectarEstilosReporteDesdeHead(raiz);
  }
  raiz.appendChild(elementoDocumento.cloneNode(true));
  return raiz;
}

function descargarPdfDesdeUrl(url: string, nombreArchivo: string): void {
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

/**
 * Abre una URL (blob del PDF) en una pestaña nueva o la descarga como fallback.
 */
function abrirUrlPdfEnNuevaPestana(
  url: string,
  nombreArchivo: string,
  revocarDespues?: () => void,
  opciones: OpcionesAperturaPdf = {},
): void {
  const ventanaReservada = opciones.ventanaDestino;

  if (ventanaReservada && !ventanaReservada.closed) {
    try {
      ventanaReservada.location.href = url;
      if (revocarDespues) window.setTimeout(revocarDespues, 120_000);
      return;
    } catch {
      cerrarVentanaPdf(ventanaReservada);
    }
  }

  const ventana = window.open(url, '_blank');
  if (ventana) {
    if (revocarDespues) window.setTimeout(revocarDespues, 120_000);
    return;
  }

  try {
    descargarPdfDesdeUrl(url, nombreArchivo);
    if (revocarDespues) window.setTimeout(revocarDespues, 120_000);
    return;
  } catch {
    /* continuar */
  }

  throw new Error(
    'El navegador bloqueó la ventana emergente. Permití ventanas emergentes desde este sitio o revisá la carpeta de descargas.',
  );
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

function crearClonAisaldoParaPdf(raizCaptura: HTMLElement): {
  elemento: HTMLElement;
  limpiar: () => void;
} {
  const envoltorio = crearEnvoltorioOffscreenPdf();
  const clon = raizCaptura.cloneNode(true) as HTMLElement;
  envoltorio.appendChild(clon);
  document.body.appendChild(envoltorio);

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

interface OpcionesCapturaPdf extends OpcionesAperturaPdf {
  selectorDocumento?: string;
  prepararClon?: (clonDocumento: HTMLElement) => void;
  antesCaptura?: (clonDocumento: HTMLElement) => () => void;
  postProcesarPdf?: (pdf: JsPdfConPaginas, clonDocumento: HTMLElement) => void;
}

async function capturarElementoComoPdf(
  raizCaptura: HTMLElement,
  nombreArchivo: string,
  opciones: OpcionesCapturaPdf = {},
): Promise<void> {
  const selectorDocumento = opciones.selectorDocumento ?? SELECTOR_DOCUMENTO_REPORTE;
  const { default: html2pdf } = await import('html2pdf.js');

  const { elemento: clonRaiz, limpiar: limpiarClon } = crearClonAisaldoParaPdf(raizCaptura);
  const clonDocumento = resolverDocumentoEnRaiz(clonRaiz, selectorDocumento);

  prepararClonParaCapturaPdf(clonDocumento);
  opciones.prepararClon?.(clonDocumento);
  const restaurarCaptura = opciones.antesCaptura?.(clonDocumento);

  let pdf: unknown;
  try {
    pdf = await html2pdf()
      .set(opcionesPdfPorDefecto(nombreArchivo))
      .from(clonRaiz)
      .toPdf()
      .get('pdf');
  } finally {
    restaurarCaptura?.();
    limpiarClon();
  }

  if (!esInstanciaJsPdf(pdf)) {
    throw new Error('No se pudo generar el archivo PDF.');
  }

  opciones.postProcesarPdf?.(pdf, clonDocumento);

  const salida = pdf.output('bloburl');
  const urlPdf = typeof salida === 'string' ? salida : URL.createObjectURL(salida);

  const revocar =
    typeof salida === 'string'
      ? undefined
      : () => {
          URL.revokeObjectURL(urlPdf);
        };

  abrirUrlPdfEnNuevaPestana(
    urlPdf,
    `${sanitizarNombreArchivo(nombreArchivo)}.pdf`,
    revocar,
    { ventanaDestino: opciones.ventanaDestino },
  );
}

async function generarPdfDesdeDocumentoReporte(
  documentoReporte: HTMLElement,
  nombreArchivo: string,
  opciones: OpcionesCapturaPdf = {},
): Promise<void> {
  const pieDatos = leerDatosPieDesdeDocumento(documentoReporte);
  const raizCaptura = armarRaizCapturaConEstilos(documentoReporte);

  await capturarElementoComoPdf(raizCaptura, nombreArchivo, {
    ...opciones,
    antesCaptura: (clonDocumento) => {
      const pieHtml = clonDocumento.querySelector('.rep-pie-pagina');
      const visibilidadPieOriginal =
        pieHtml instanceof HTMLElement ? pieHtml.style.visibility : '';

      if (pieHtml instanceof HTMLElement) {
        pieHtml.style.visibility = 'hidden';
      }

      const restaurarEstilosExportacion = clonDocumento.classList.contains('rep-doc')
        ? activarEstilosExportacionPdf(clonDocumento)
        : () => {};

      const restaurarPersonalizado = opciones.antesCaptura?.(clonDocumento);

      return () => {
        restaurarPersonalizado?.();
        restaurarEstilosExportacion();
        if (pieHtml instanceof HTMLElement) {
          pieHtml.style.visibility = visibilidadPieOriginal;
        }
      };
    },
    postProcesarPdf: (pdf, clonDocumento) => {
      if (pieDatos && clonDocumento.classList.contains('rep-doc')) {
        dibujarPieEnTodasLasPaginasPdf(pdf, pieDatos);
      }
      opciones.postProcesarPdf?.(pdf, clonDocumento);
    },
  });
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
  const envoltorio = crearEnvoltorioOffscreenPdf();
  envoltorio.innerHTML = fragmentoHtml;
  document.body.appendChild(envoltorio);

  try {
    const documento = resolverDocumentoEnRaiz(envoltorio, selectorDocumento);
    await generarPdfDesdeDocumentoReporte(documento, nombreArchivo, {
      ...opciones,
      selectorDocumento,
    });
  } finally {
    document.body.removeChild(envoltorio);
  }
}

export async function exportarElementoReporteComoPdf(
  elementoReporte: HTMLElement,
  nombreArchivo: string,
  opciones: OpcionesAperturaPdf = {},
): Promise<void> {
  await generarPdfDesdeDocumentoReporte(elementoReporte, nombreArchivo, opciones);
}

/**
 * Genera PDF a partir del HTML del reporte (mismo contenido que la vista previa con filtros aplicados).
 */
export async function exportarReporteComoPdf(
  cuerpoHtml: string,
  nombreArchivo: string,
  opciones: OpcionesAperturaPdf = {},
): Promise<void> {
  if (!cuerpoHtml.trim()) {
    throw new Error('No hay contenido de reporte para exportar.');
  }

  const envoltorio = crearEnvoltorioOffscreenPdf();
  envoltorio.innerHTML = cuerpoHtml;
  document.body.appendChild(envoltorio);

  try {
    const documento = resolverDocumentoEnRaiz(envoltorio, SELECTOR_DOCUMENTO_REPORTE);
    await generarPdfDesdeDocumentoReporte(documento, nombreArchivo, opciones);
  } finally {
    document.body.removeChild(envoltorio);
  }
}

/**
 * Genera el PDF con los filtros aplicados y lo abre en una nueva pestaña.
 * Usa el HTML renderizado (incluye estilos) para evitar capturas vacías o sin formato.
 */
export async function exportarVistaReporteComoPdf(
  htmlReporte: string,
  nombreArchivo: string,
  contenedorVista?: HTMLElement | null,
  opciones: OpcionesAperturaPdf = {},
): Promise<void> {
  const documentoDom = contenedorVista?.querySelector(SELECTOR_DOCUMENTO_REPORTE);
  const vistaConEscalaMovil = contenedorVista?.closest('.rep-preview-escala--activa');

  if (documentoDom instanceof HTMLElement && !vistaConEscalaMovil) {
    await exportarElementoReporteComoPdf(documentoDom, nombreArchivo, opciones);
    return;
  }

  await exportarReporteComoPdf(htmlReporte, nombreArchivo, opciones);
}
