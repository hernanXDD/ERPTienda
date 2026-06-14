import { esColorHexValido, normalizarColorHex } from './color-hex';

describe('color-hex', () => {
  describe('esColorHexValido', () => {
    it('valida colores hex de 6 dígitos', () => {
      expect(esColorHexValido('#4a5fd7')).toBe(true);
      expect(esColorHexValido(' #4a5fd7 ')).toBe(true);
    });

    it('rechaza valores inválidos', () => {
      expect(esColorHexValido('#abc')).toBe(false);
      expect(esColorHexValido('rojo')).toBe(false);
    });
  });

  describe('normalizarColorHex', () => {
    it('normaliza a minúsculas', () => {
      expect(normalizarColorHex('#AABBCC', '#000000')).toBe('#aabbcc');
    });

    it('usa el valor por defecto si falta o es inválido', () => {
      expect(normalizarColorHex(undefined, '#f2f5fa')).toBe('#f2f5fa');
      expect(normalizarColorHex('invalido', '#f2f5fa')).toBe('#f2f5fa');
    });
  });
});
