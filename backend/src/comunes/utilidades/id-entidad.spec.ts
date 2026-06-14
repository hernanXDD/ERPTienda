import { BadRequestException } from '@nestjs/common';
import {
  formatearIdEntidad,
  MAXIMO_ID_ENTIDAD,
  obtenerSiguienteIdEntidad,
  parsearIdEntidad,
} from './id-entidad';

describe('id-entidad', () => {
  describe('formatearIdEntidad', () => {
    it('rellena con ceros a la izquierda', () => {
      expect(formatearIdEntidad(1)).toBe('000001');
      expect(formatearIdEntidad(999_999)).toBe('999999');
    });

    it('rechaza valores fuera de rango', () => {
      expect(() => formatearIdEntidad(0)).toThrow(BadRequestException);
      expect(() => formatearIdEntidad(MAXIMO_ID_ENTIDAD + 1)).toThrow(BadRequestException);
      expect(() => formatearIdEntidad(1.5)).toThrow(BadRequestException);
    });
  });

  describe('parsearIdEntidad', () => {
    it('parsea ids de 6 dígitos', () => {
      expect(parsearIdEntidad('000042')).toBe(42);
    });

    it('rechaza formatos inválidos', () => {
      expect(() => parsearIdEntidad('42')).toThrow(BadRequestException);
      expect(() => parsearIdEntidad('abcdef')).toThrow(BadRequestException);
    });
  });

  describe('obtenerSiguienteIdEntidad', () => {
    it('devuelve 000001 si no hay ids previos', async () => {
      await expect(obtenerSiguienteIdEntidad(async () => null)).resolves.toBe('000001');
    });

    it('incrementa el último id formateado', async () => {
      await expect(obtenerSiguienteIdEntidad(async () => '000010')).resolves.toBe('000011');
    });
  });
});
