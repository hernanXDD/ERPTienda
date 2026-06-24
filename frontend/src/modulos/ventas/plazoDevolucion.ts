/** Días calendario transcurridos desde la fecha de la venta (mínimo 0). */
export function diasTranscurridosDesdeVenta(fechaIso: string): number {
  const ms = Date.now() - new Date(fechaIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** Indica si la venta sigue dentro del plazo configurado para devoluciones. */
export function ventaPermiteDevolucion(
  fechaIso: string,
  diasPlazoDevolucion: number,
): boolean {
  const plazo = Math.max(1, Math.floor(diasPlazoDevolucion));
  return diasTranscurridosDesdeVenta(fechaIso) <= plazo;
}
