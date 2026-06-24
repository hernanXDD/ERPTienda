import { redondearMoneda } from './validar-totales-comprobante';

/** Montos de venta necesarios para prorratear el reembolso cuando hubo descuento (cupón u otro ajuste). */
export interface MontosVentaParaReembolso {
  subtotal: number;
  total: number;
}

/**
 * Factor con el que se ajusta el subtotal bruto devuelto al monto efectivamente abonado en la venta.
 * Ej.: venta $10.000 con cupón 20 % → factor 0,8.
 */
export function factorReembolsoVenta(venta: MontosVentaParaReembolso): number {
  const subtotal = redondearMoneda(venta.subtotal);
  const total = redondearMoneda(venta.total);
  if (subtotal <= 0 || total >= subtotal) return 1;
  return total / subtotal;
}

/** Subtotal bruto de una línea devuelta (sin prorratear descuentos de la venta). */
export function subtotalBrutoLineaDevolucion(cantidad: number, precioUnitario: number): number {
  return redondearMoneda(cantidad * precioUnitario);
}

/** Subtotal efectivo a reembolsar por una línea, considerando descuentos de la venta origen. */
export function subtotalEfectivoLineaDevolucion(
  venta: MontosVentaParaReembolso,
  cantidad: number,
  precioUnitario: number,
): number {
  const bruto = subtotalBrutoLineaDevolucion(cantidad, precioUnitario);
  return redondearMoneda(bruto * factorReembolsoVenta(venta));
}
