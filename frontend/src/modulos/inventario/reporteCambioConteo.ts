import { formatearNumeroReporte } from '../reportes/formatoMonedaReporte';
import { obtenerEmisorNegocioReporte } from '../reportes/emisorNegocioReporte';
import { renderizarPlantillaReporte } from '../reportes/motorEtaReportes';
import { exportarReporteComoPdf } from '../reportes/impresionReporte';
import plantillaCambioConteo from '../reportes/plantillas/cambio-conteo.eta?raw';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import type { CambioConteoPrevisto } from './plantillaConteoFisico';

export interface MetadatosReporteCambioConteo {
  nombreArchivoOrigen: string;
  observacion: string;
  operador: string;
}

export interface FilaReporteCambioConteo {
  codigo: string;
  articulo: string;
  stockInicial: string;
  stockFinal: string;
  variacion: string;
  esSubida: boolean;
  esBajada: boolean;
}

export interface DatosReporteCambioConteo {
  tituloReporte: string;
  negocioNombre: string;
  generadoEl: string;
  archivoOrigen: string;
  observacion: string;
  operador: string;
  cantidadCambios: string;
  totalUnidadesVariacion: string;
  filas: FilaReporteCambioConteo[];
  sinFilas: boolean;
  notaPieReporte?: string;
}

function formatearVariacion(delta: number): string {
  if (delta > 0) return `+${formatearNumeroReporte(delta)}`;
  return formatearNumeroReporte(delta);
}

export function calcularReporteCambioConteo(
  cambios: readonly CambioConteoPrevisto[],
  metadatos: MetadatosReporteCambioConteo,
): DatosReporteCambioConteo {
  const filas: FilaReporteCambioConteo[] = cambios.map((c) => ({
    codigo: c.codigoProducto,
    articulo: c.nombreProducto,
    stockInicial: formatearNumeroReporte(c.cantidadAnterior),
    stockFinal: formatearNumeroReporte(c.cantidadNueva),
    variacion: formatearVariacion(c.delta),
    esSubida: c.delta > 0,
    esBajada: c.delta < 0,
  }));

  const totalUnidades = cambios.reduce((suma, c) => suma + Math.abs(c.delta), 0);

  return {
    tituloReporte: 'Reporte de cambio de stock por conteo',
    ...obtenerEmisorNegocioReporte(),
    generadoEl: formatearFechaYHora(new Date()),
    archivoOrigen: metadatos.nombreArchivoOrigen.trim() || '—',
    observacion: metadatos.observacion.trim() || '—',
    operador: metadatos.operador.trim() || '—',
    cantidadCambios: formatearNumeroReporte(cambios.length),
    totalUnidadesVariacion: formatearNumeroReporte(totalUnidades),
    filas,
    sinFilas: filas.length === 0,
    notaPieReporte: 'Respaldo de conteo físico importado · Uso interno',
  };
}

function nombreArchivoReporteCambioConteo(): string {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const hh = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  return `reporte-cambio-stock_${yyyy}-${mm}-${dd}_${hh}${min}`;
}

export async function exportarReporteCambioConteoPdf(
  cambios: readonly CambioConteoPrevisto[],
  metadatos: MetadatosReporteCambioConteo,
): Promise<void> {
  const datos = calcularReporteCambioConteo(cambios, metadatos);
  const html = renderizarPlantillaReporte(plantillaCambioConteo, datos);
  await exportarReporteComoPdf(html, nombreArchivoReporteCambioConteo());
}

export function renderizarVistaPreviaReporteCambioConteo(
  cambios: readonly CambioConteoPrevisto[],
  metadatos: MetadatosReporteCambioConteo,
): string {
  const datos = calcularReporteCambioConteo(cambios, metadatos);
  return renderizarPlantillaReporte(plantillaCambioConteo, datos);
}
