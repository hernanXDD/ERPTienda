import type { CompraRegistrada } from '../../tipos/compraRegistrada';

/**
 * Último costo unitario registrado en compras para alguna variante del producto.
 * Si hay varias líneas en la misma compra, se promedia ponderado por cantidad.
 */
export function obtenerUltimoCostoCompraProducto(
  idsVariantes: readonly string[],
  compras: readonly CompraRegistrada[],
): number | null {
  if (idsVariantes.length === 0 || compras.length === 0) return null;

  const conjunto = new Set(idsVariantes);
  const ordenadas = [...compras].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  for (const compra of ordenadas) {
    const lineas = compra.lineas.filter(
      (ln) => ln.varianteId !== null && conjunto.has(ln.varianteId),
    );
    if (lineas.length === 0) continue;

    let unidades = 0;
    let costoTotal = 0;
    for (const ln of lineas) {
      unidades += ln.cantidad;
      costoTotal += ln.cantidad * ln.costoUnitario;
    }
    if (unidades <= 0) continue;
    return Math.round(costoTotal / unidades);
  }

  return null;
}

/** Porcentaje de ganancia sobre el costo de compra: ((venta - compra) / compra) × 100. */
export function calcularPorcentajeGanancia(
  precioVenta: number,
  precioCompra: number | null,
): number | null {
  if (precioCompra === null || precioCompra <= 0) return null;
  if (!Number.isFinite(precioVenta) || precioVenta < 0) return null;
  return ((precioVenta - precioCompra) / precioCompra) * 100;
}

/** Precio de venta sugerido aplicando un margen sobre el costo de compra. */
export function calcularPrecioVentaSugerido(
  precioCompra: number | null,
  porcentajeGanancia: number,
): number | null {
  if (precioCompra === null || precioCompra <= 0) return null;
  if (!Number.isFinite(porcentajeGanancia) || porcentajeGanancia < 0) return null;
  return Math.round(precioCompra * (1 + porcentajeGanancia / 100));
}
