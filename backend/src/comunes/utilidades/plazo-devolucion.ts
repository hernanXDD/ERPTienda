/** Días calendario transcurridos desde la fecha de la venta (mínimo 0). */
export function diasTranscurridosDesdeVenta(fechaVenta: Date): number {
  const ms = Date.now() - fechaVenta.getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function ventaDentroPlazoDevolucion(fechaVenta: Date, diasPlazo: number): boolean {
  const plazo = Math.max(1, Math.floor(diasPlazo));
  return diasTranscurridosDesdeVenta(fechaVenta) <= plazo;
}
