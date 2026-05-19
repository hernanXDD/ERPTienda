/**
 * Existencias físicas por producto antes de reproducir ventas de semilla
 * (solo ids presentes en el catálogo de demostración).
 */
export const CANTIDAD_INICIAL_POR_PRODUCTO_SEMILLA: Record<string, number> = {
  'p0000001-0000-4000-8000-000000000001': 260,
  'p0000001-0000-4000-8000-000000000002': 148,
};

export function cantidadInicialSemillaPorProductoId(productoId: string): number {
  return CANTIDAD_INICIAL_POR_PRODUCTO_SEMILLA[productoId] ?? 0;
}
