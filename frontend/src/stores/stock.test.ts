import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useStockStore } from './stock';

describe('useStockStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('devuelve cero cuando no hay stock cargado para la variante', () => {
    const store = useStockStore();
    expect(store.cantidadActual('000101')).toBe(0);
  });

  it('valida stock disponible antes de una venta', () => {
    const store = useStockStore();
    store.cantidadesPorVarianteId = {
      '000101': 5,
      '000102': 1,
    };

    expect(
      store.validacionAntesDeVenta([
        {
          varianteId: '000101',
          nombre: 'Remera M',
          cantidad: 3,
          precioUnitario: 1000,
          subtotal: 3000,
        },
      ]),
    ).toBeNull();

    const faltas = store.validacionAntesDeVenta([
      {
        varianteId: '000102',
        nombre: 'Pantalón 42',
        cantidad: 2,
        precioUnitario: 2000,
        subtotal: 4000,
      },
    ]);

    expect(faltas).toEqual([
      {
        varianteId: '000102',
        nombre: 'Pantalón 42',
        solicitado: 2,
        disponible: 1,
      },
    ]);
  });

  it('elimina variantes del mapa local', () => {
    const store = useStockStore();
    store.cantidadesPorVarianteId = { '000101': 4, '000102': 2 };

    store.quitarVariante('000101');

    expect(store.cantidadesPorVarianteId['000101']).toBeUndefined();
    expect(store.cantidadesPorVarianteId['000102']).toBe(2);
  });
});
