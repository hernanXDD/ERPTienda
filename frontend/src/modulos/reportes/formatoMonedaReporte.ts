const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const formatoNumero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export function formatearMonedaReporte(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return formatoMoneda.format(valor);
}

export function formatearNumeroReporte(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return formatoNumero.format(valor);
}

export function formatearPorcentajeReporte(valor: number, total: number): string {
  if (!Number.isFinite(total) || total <= 0) return '0 %';
  const pct = (valor / total) * 100;
  return `${pct.toFixed(1).replace('.', ',')} %`;
}
