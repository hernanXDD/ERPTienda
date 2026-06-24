import type { LineaDevolucionDto } from '../dto/registrar-devolucion.dto';

/** Suma cantidades si la misma línea de venta aparece más de una vez en el pedido. */
export function agruparLineasDevolucion(lineas: LineaDevolucionDto[]): LineaDevolucionDto[] {
  const mapa = new Map<string, number>();
  for (const linea of lineas) {
    mapa.set(linea.ventaLineaId, (mapa.get(linea.ventaLineaId) ?? 0) + linea.cantidad);
  }
  return [...mapa.entries()].map(([ventaLineaId, cantidad]) => ({ ventaLineaId, cantidad }));
}
