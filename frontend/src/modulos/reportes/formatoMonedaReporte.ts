import { formatearDecimal, formatearMoneda, formatearNumero } from '../../utilidades/formatoMoneda';

export function formatearMonedaReporte(valor: number): string {
  return formatearMoneda(valor);
}

export function formatearNumeroReporte(valor: number): string {
  return formatearNumero(valor);
}

export function formatearPorcentajeReporte(valor: number, total: number): string {
  if (!Number.isFinite(total) || total <= 0) return '0 %';
  const pct = (valor / total) * 100;
  return `${formatearDecimal(pct, 1)} %`;
}
