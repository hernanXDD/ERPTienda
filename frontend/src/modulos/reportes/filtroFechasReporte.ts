import { obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';
import { formatearFechaDiaMesAnio } from '../../utilidades/formatoFechaHora';

export interface FiltroFechasReporte {
  fechaDesde: string;
  fechaHasta: string;
}

export function diaComparableHoy(): string {
  return obtenerDiaComparableDesdeValor(new Date());
}

/** Solo el día actual (cierre diario). */
export function rangoFechasHoy(): FiltroFechasReporte {
  const hoy = diaComparableHoy();
  return { fechaDesde: hoy, fechaHasta: hoy };
}

/** Últimos 90 días para reportes operativos. */
export function rangoFechasPorDefecto(): FiltroFechasReporte {
  return rangoFechasUltimosDias(90);
}

export function rangoFechasUltimosDias(cantidadDias: number): FiltroFechasReporte {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - Math.max(0, cantidadDias - 1));
  return {
    fechaDesde: obtenerDiaComparableDesdeValor(desde),
    fechaHasta: obtenerDiaComparableDesdeValor(hoy),
  };
}

export function estaEnRangoFechas(isoFecha: string, filtro: FiltroFechasReporte): boolean {
  const dia = obtenerDiaComparableDesdeValor(isoFecha);
  if (!dia) return false;
  return dia >= filtro.fechaDesde && dia <= filtro.fechaHasta;
}

export function esRangoFechasValido(filtro: FiltroFechasReporte): boolean {
  if (!filtro.fechaDesde || !filtro.fechaHasta) return false;
  return filtro.fechaDesde <= filtro.fechaHasta;
}

export function formatearRangoFechasLegible(filtro: FiltroFechasReporte): string {
  const desde = formatearFechaDiaMesAnio(`${filtro.fechaDesde}T12:00:00`);
  const hasta = formatearFechaDiaMesAnio(`${filtro.fechaHasta}T12:00:00`);
  return `${desde} — ${hasta}`;
}

/**
 * Arma el rango para exportar PDF de cuenta corriente desde filtros opcionales
 * y las fechas de los movimientos de la entidad.
 */
export function armarFiltroFechasReporteDesdeMovimientos(
  fechaDesde: string | undefined,
  fechaHasta: string | undefined,
  fechasIsoMovimientos: string[],
): FiltroFechasReporte {
  const diasMovs = fechasIsoMovimientos
    .map((fecha) => obtenerDiaComparableDesdeValor(fecha))
    .filter((d): d is string => Boolean(d))
    .sort();

  const hoy = diaComparableHoy();
  const minMov = diasMovs[0] ?? hoy;
  const maxMov = diasMovs[diasMovs.length - 1] ?? hoy;

  const desdeTrim = fechaDesde?.trim() ?? '';
  const hastaTrim = fechaHasta?.trim() ?? '';

  return {
    fechaDesde: desdeTrim || minMov,
    fechaHasta: hastaTrim || (desdeTrim ? hoy : maxMov),
  };
}
