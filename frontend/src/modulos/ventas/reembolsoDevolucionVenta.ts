import type { VentaRegistrada } from '../../tipos/venta';

export interface LineaCantidadPrecio {
  cantidad: number;
  precioUnitario: number;
}

function redondearMoneda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Factor de reembolso cuando la venta tuvo descuento (cupón u otro ajuste negativo). */
export function factorReembolsoVenta(venta: Pick<VentaRegistrada, 'subtotal' | 'total'>): number {
  const subtotal = redondearMoneda(venta.subtotal);
  const total = redondearMoneda(venta.total);
  if (subtotal <= 0 || total >= subtotal) return 1;
  return total / subtotal;
}

export function subtotalBrutoLineasDevolucion(lineas: LineaCantidadPrecio[]): number {
  return redondearMoneda(
    lineas.reduce((acc, ln) => acc + ln.cantidad * ln.precioUnitario, 0),
  );
}

/** Monto efectivo a reembolsar según lo abonado en la venta origen. */
export function subtotalEfectivoDevolucion(
  venta: Pick<VentaRegistrada, 'subtotal' | 'total'>,
  lineas: LineaCantidadPrecio[],
): number {
  return redondearMoneda(subtotalBrutoLineasDevolucion(lineas) * factorReembolsoVenta(venta));
}
