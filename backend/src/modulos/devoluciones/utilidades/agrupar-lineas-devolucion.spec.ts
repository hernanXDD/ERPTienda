import { agruparLineasDevolucion } from './agrupar-lineas-devolucion';

describe('agruparLineasDevolucion', () => {
  it('conserva una sola línea si no hay duplicados', () => {
    expect(
      agruparLineasDevolucion([{ ventaLineaId: '000001', cantidad: 2 }]),
    ).toEqual([{ ventaLineaId: '000001', cantidad: 2 }]);
  });

  it('suma cantidades de la misma ventaLineaId', () => {
    expect(
      agruparLineasDevolucion([
        { ventaLineaId: '000001', cantidad: 1 },
        { ventaLineaId: '000001', cantidad: 2 },
        { ventaLineaId: '000002', cantidad: 1 },
      ]),
    ).toEqual([
      { ventaLineaId: '000001', cantidad: 3 },
      { ventaLineaId: '000002', cantidad: 1 },
    ]);
  });
});
