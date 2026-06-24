import { describe, expect, it } from 'vitest';
import { factorReembolsoVenta, subtotalEfectivoDevolucion } from './reembolsoDevolucionVenta';

describe('reembolsoDevolucionVenta', () => {
  it('no prorratea si la venta no tuvo descuento', () => {
    const venta = { subtotal: 10_000, total: 10_000 };
    expect(factorReembolsoVenta(venta)).toBe(1);
    expect(
      subtotalEfectivoDevolucion(venta, [{ cantidad: 1, precioUnitario: 5_000 }]),
    ).toBe(5_000);
  });

  it('prorratea el reembolso cuando hubo cupón en la venta', () => {
    const venta = { subtotal: 10_000, total: 8_000 };
    expect(factorReembolsoVenta(venta)).toBe(0.8);
    expect(
      subtotalEfectivoDevolucion(venta, [{ cantidad: 1, precioUnitario: 5_000 }]),
    ).toBe(4_000);
  });
});
