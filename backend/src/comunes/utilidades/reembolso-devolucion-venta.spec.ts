import {
  factorReembolsoVenta,
  subtotalEfectivoLineaDevolucion,
} from './reembolso-devolucion-venta';

describe('reembolso-devolucion-venta', () => {
  it('mantiene el subtotal bruto si la venta no tuvo descuento', () => {
    expect(
      subtotalEfectivoLineaDevolucion({ subtotal: 10_000, total: 10_000 }, 1, 5_000),
    ).toBe(5_000);
    expect(factorReembolsoVenta({ subtotal: 10_000, total: 10_000 })).toBe(1);
  });

  it('prorratea el reembolso cuando la venta tuvo cupón o ajuste negativo', () => {
    expect(factorReembolsoVenta({ subtotal: 10_000, total: 8_000 })).toBe(0.8);
    expect(
      subtotalEfectivoLineaDevolucion({ subtotal: 10_000, total: 8_000 }, 1, 5_000),
    ).toBe(4_000);
  });
});
