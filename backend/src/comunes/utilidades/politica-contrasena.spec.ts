import {
  cumplePoliticaContrasena,
  MENSAJE_POLITICA_CONTRASENA,
  PATRON_POLITICA_CONTRASENA,
} from './politica-contrasena';

describe('politica-contrasena', () => {
  it('exige al menos 8 caracteres, una mayúscula y un número', () => {
    expect(PATRON_POLITICA_CONTRASENA.test('12345678')).toBe(false);
    expect(PATRON_POLITICA_CONTRASENA.test('abcdefgh')).toBe(false);
    expect(PATRON_POLITICA_CONTRASENA.test('Abcdefgh')).toBe(false);
    expect(PATRON_POLITICA_CONTRASENA.test('Abcdefg1')).toBe(true);
  });

  it('expone mensaje descriptivo para validaciones', () => {
    expect(MENSAJE_POLITICA_CONTRASENA).toContain('8 caracteres');
  });

  describe('cumplePoliticaContrasena', () => {
    it('acepta contraseñas válidas', () => {
      expect(cumplePoliticaContrasena('Admin123')).toBe(true);
    });

    it('rechaza contraseñas débiles', () => {
      expect(cumplePoliticaContrasena('admin123')).toBe(false);
      expect(cumplePoliticaContrasena('ADMIN')).toBe(false);
    });
  });
});
