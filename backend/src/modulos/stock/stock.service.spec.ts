import { StockService } from './stock.service';

describe('StockService', () => {
  const crearServicio = () =>
    new StockService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

  describe('validarStockParaVenta', () => {
    it('valida cada línea por separado si no hay variantes repetidas', () => {
      const servicio = crearServicio();
      const cantidades = new Map([['000101', 2]]);

      expect(
        servicio.validarStockParaVenta(
          [{ varianteId: '000101', nombre: 'Remera M', cantidad: 2 }],
          cantidades,
        ),
      ).toBeNull();

      expect(
        servicio.validarStockParaVenta(
          [{ varianteId: '000101', nombre: 'Remera M', cantidad: 3 }],
          cantidades,
        ),
      ).toEqual([
        { varianteId: '000101', nombre: 'Remera M', solicitado: 3, disponible: 2 },
      ]);
    });

    it('suma cantidades de la misma variante en una sola venta', () => {
      const servicio = crearServicio();
      const cantidades = new Map([['000101', 3]]);

      expect(
        servicio.validarStockParaVenta(
          [
            { varianteId: '000101', nombre: 'Remera M', cantidad: 2 },
            { varianteId: '000101', nombre: 'Remera M', cantidad: 2 },
          ],
          cantidades,
        ),
      ).toEqual([
        { varianteId: '000101', nombre: 'Remera M', solicitado: 4, disponible: 3 },
      ]);
    });
  });

  describe('bloquearCantidadesStock', () => {
    it('bloquea variantes en orden ascendente para evitar deadlocks', async () => {
      const servicio = crearServicio();
      const consultas: string[] = [];
      const tx = {
        $queryRaw: jest.fn(async (strings: TemplateStringsArray, varianteId: string) => {
          consultas.push(varianteId);
          return [{ cantidad_actual: 5 }];
        }),
      };

      const mapa = await servicio.bloquearCantidadesStock(tx as never, [
        '000202',
        '000101',
        '000202',
      ]);

      expect(consultas).toEqual(['000101', '000202']);
      expect(mapa.get('000101')).toBe(5);
      expect(mapa.get('000202')).toBe(5);
    });

    it('trata variante sin fila de stock como cantidad cero', async () => {
      const servicio = crearServicio();
      const tx = {
        $queryRaw: jest.fn(async () => []),
      };

      const mapa = await servicio.bloquearCantidadesStock(tx as never, ['000999']);

      expect(mapa.get('000999')).toBe(0);
    });
  });
});
