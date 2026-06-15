import { BadRequestException } from '@nestjs/common';
import {
  redondearMoneda,
  validarLineasYTotalComprobante,
} from './validar-totales-comprobante';

describe('validar-totales-comprobante', () => {
  describe('redondearMoneda', () => {
    it('redondea a dos decimales', () => {
      expect(redondearMoneda(10.005)).toBe(10.01);
      expect(redondearMoneda(10.004)).toBe(10);
    });
  });

  describe('validarLineasYTotalComprobante', () => {
    it('normaliza líneas y total cuando son coherentes', () => {
      const resultado = validarLineasYTotalComprobante(
        [{ cantidad: 2, precioUnitario: 1500.5, subtotal: 3001 }],
        3001,
      );

      expect(resultado.totalCalculado).toBe(3001);
      expect(resultado.subtotalLineas).toBe(3001);
      expect(resultado.lineasNormalizadas).toEqual([
        { cantidad: 2, precioUnitario: 1500.5, subtotal: 3001 },
      ]);
    });

    it('rechaza comprobante sin líneas', () => {
      expect(() => validarLineasYTotalComprobante([], 0)).toThrow(BadRequestException);
    });

    it('rechaza subtotal incorrecto en una línea', () => {
      expect(() =>
        validarLineasYTotalComprobante(
          [{ cantidad: 2, precioUnitario: 100, subtotal: 250 }],
          200,
          'costo unitario',
        ),
      ).toThrow(/costo unitario/);
    });

    it('rechaza total distinto a la suma de líneas', () => {
      expect(() =>
        validarLineasYTotalComprobante(
          [{ cantidad: 1, precioUnitario: 100, subtotal: 100 }],
          150,
        ),
      ).toThrow(/total no coincide/);
    });

    it('acepta descuento sobre el subtotal de líneas', () => {
      const resultado = validarLineasYTotalComprobante(
        [{ cantidad: 1, precioUnitario: 1000, subtotal: 1000 }],
        900,
        'precio unitario',
        -100,
      );
      expect(resultado.subtotalLineas).toBe(1000);
      expect(resultado.totalCalculado).toBe(900);
    });

    it('acepta recargo sobre el subtotal de líneas', () => {
      const resultado = validarLineasYTotalComprobante(
        [{ cantidad: 2, precioUnitario: 500, subtotal: 1000 }],
        1050,
        'precio unitario',
        50,
      );
      expect(resultado.totalCalculado).toBe(1050);
    });

    it('tolera diferencias menores a un centavo', () => {
      const resultado = validarLineasYTotalComprobante(
        [{ cantidad: 3, precioUnitario: 33.33, subtotal: 99.99 }],
        99.99,
      );
      expect(resultado.totalCalculado).toBe(99.99);
    });
  });
});
