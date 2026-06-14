import { describe, expect, it } from 'vitest';
import {
  aclararHex,
  esColorHexValido,
  normalizarColorHex,
  oscurecerHex,
  rgbaDesdeHex,
} from './colorUtilidades';

describe('colorUtilidades', () => {
  describe('esColorHexValido', () => {
    it('acepta hex de 6 dígitos con #', () => {
      expect(esColorHexValido('#4a5fd7')).toBe(true);
      expect(esColorHexValido('#FFFFFF')).toBe(true);
    });

    it('rechaza formatos inválidos', () => {
      expect(esColorHexValido('4a5fd7')).toBe(false);
      expect(esColorHexValido('#fff')).toBe(false);
      expect(esColorHexValido('#gggggg')).toBe(false);
      expect(esColorHexValido('')).toBe(false);
    });
  });

  describe('normalizarColorHex', () => {
    it('devuelve el color en minúsculas si es válido', () => {
      expect(normalizarColorHex('#4A5FD7', '#000000')).toBe('#4a5fd7');
    });

    it('usa el valor por defecto si el color es inválido', () => {
      expect(normalizarColorHex('rojo', '#f2f5fa')).toBe('#f2f5fa');
    });
  });

  describe('oscurecerHex y aclararHex', () => {
    it('oscurece hacia negro', () => {
      expect(oscurecerHex('#ffffff', 1)).toBe('#000000');
    });

    it('aclara hacia blanco', () => {
      expect(aclararHex('#000000', 1)).toBe('#ffffff');
    });
  });

  describe('rgbaDesdeHex', () => {
    it('genera rgba con alpha indicado', () => {
      expect(rgbaDesdeHex('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });
  });
});
