import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import { formatearRangoFechasLegible, type FiltroFechasReporte } from './filtroFechasReporte';

export const NOMBRE_NEGOCIO_REPORTE = 'ERP Tienda';

export function metadatosComunesReporte(
  filtro: FiltroFechasReporte,
  filtroEntidadLegible = ''
) {
  return {
    negocioNombre: NOMBRE_NEGOCIO_REPORTE,
    rangoLegible: formatearRangoFechasLegible(filtro),
    filtroEntidadLegible,
    generadoEl: formatearFechaYHora(new Date()),
  };
}
