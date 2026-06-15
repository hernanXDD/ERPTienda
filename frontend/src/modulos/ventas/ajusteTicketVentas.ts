export type TipoAjusteTicket = 'NINGUNO' | 'DESCUENTO' | 'RECARGO';

export function redondearPesos(valor: number): number {
  return Math.round(valor);
}

export function parsearPorcentajeAjuste(texto: string): number | null {
  const bruto = Number.parseFloat(texto.replace(',', '.').trim());
  if (!Number.isFinite(bruto) || bruto <= 0) return null;
  return Math.min(bruto, 100);
}

export function calcularAjusteTicketDesdePorcentaje(
  subtotal: number,
  tipo: TipoAjusteTicket,
  porcentajeTexto: string,
): { ajusteMonto: number; porcentaje: number | null } {
  if (tipo === 'NINGUNO' || subtotal <= 0) {
    return { ajusteMonto: 0, porcentaje: null };
  }

  const porcentaje = parsearPorcentajeAjuste(porcentajeTexto);
  if (porcentaje === null) {
    return { ajusteMonto: 0, porcentaje: null };
  }

  const monto = redondearPesos(subtotal * (porcentaje / 100));
  if (tipo === 'DESCUENTO') {
    return { ajusteMonto: -Math.min(monto, subtotal), porcentaje };
  }
  return { ajusteMonto: monto, porcentaje };
}

export function etiquetaAjustePorcentaje(
  tipo: TipoAjusteTicket,
  porcentaje: number | null,
): string {
  if (tipo === 'NINGUNO' || porcentaje === null) return '';
  return tipo === 'DESCUENTO' ? `Descuento ${porcentaje}%` : `Recargo ${porcentaje}%`;
}
