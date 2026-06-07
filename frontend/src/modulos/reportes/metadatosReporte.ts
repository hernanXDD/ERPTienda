import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import { obtenerEmisorNegocioReporte } from '../reportes/emisorNegocioReporte';
import { formatearRangoFechasLegible, type FiltroFechasReporte } from './filtroFechasReporte';

/** Nombre del negocio para encabezados y pies de reportes (desde configuración). */
export function obtenerNombreNegocioReporte(): string {
  return obtenerEmisorNegocioReporte().negocioNombre;
}

export function metadatosComunesReporte(
  filtro: FiltroFechasReporte,
  filtroEntidadLegible = '',
) {
  return {
    ...obtenerEmisorNegocioReporte(),
    rangoLegible: formatearRangoFechasLegible(filtro),
    filtroEntidadLegible,
    generadoEl: formatearFechaYHora(new Date()),
  };
}
