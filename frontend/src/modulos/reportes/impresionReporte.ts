import type { FiltroFechasReporte } from './filtroFechasReporte';
import { estilosBaseReporteCss } from './estilosReporteCss';

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

const opcionesPdfPorDefecto = (nombreArchivo: string) => ({
  margin: [8, 8, 10, 8] as number[],
  filename: `${sanitizarNombreArchivo(nombreArchivo)}.pdf`,
  image: { type: 'jpeg', quality: 0.95 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  pagebreak: { mode: ['css', 'legacy'] as string[] },
});

function esInstanciaJsPdf(valor: unknown): valor is { output: (tipo: string) => string | Blob } {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'output' in valor &&
    typeof (valor as { output: unknown }).output === 'function'
  );
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

/**
 * Genera un PDF del nodo `.rep-doc` y lo abre en una nueva pestaña del navegador.
 */
async function generarPdfDesdeElemento(
  elementoReporte: HTMLElement,
  nombreArchivo: string
): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');

  const pdf = await html2pdf()
    .set(opcionesPdfPorDefecto(nombreArchivo))
    .from(elementoReporte)
    .toPdf()
    .get('pdf');

  if (!esInstanciaJsPdf(pdf)) {
    throw new Error('No se pudo generar el archivo PDF.');
  }

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
  envoltorio.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;max-width:794px;background:#fff;z-index:-1;pointer-events:none;';
  envoltorio.innerHTML = cuerpoHtml;
  document.body.appendChild(envoltorio);

  const documento = envoltorio.querySelector('.rep-doc');
  if (!(documento instanceof HTMLElement)) {
    document.body.removeChild(envoltorio);
    throw new Error('No se encontró el contenido del reporte para exportar.');
  }

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
