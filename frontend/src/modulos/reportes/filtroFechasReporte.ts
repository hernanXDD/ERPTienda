import { obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';
import { formatearFechaDiaMesAnio } from '../../utilidades/formatoFechaHora';

export interface FiltroFechasReporte {
  fechaDesde: string;
  fechaHasta: string;
}

export function diaComparableHoy(): string {
  return obtenerDiaComparableDesdeValor(new Date());
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
