import { siguienteNumeroComprobante } from './numero-comprobante';

describe('numero-comprobante', () => {
  it('genera el primer número cuando no hay comprobantes previos', () => {
    expect(siguienteNumeroComprobante('V', null)).toBe('V-00001');
    expect(siguienteNumeroComprobante('C', null)).toBe('C-00001');
  });

  it('incrementa el último número del mismo prefijo', () => {
    expect(siguienteNumeroComprobante('V', 'V-00009')).toBe('V-00010');
    expect(siguienteNumeroComprobante('C', 'C-12345')).toBe('C-12346');
  });

  it('ignora números de otro prefijo', () => {
    expect(siguienteNumeroComprobante('V', 'C-00099')).toBe('V-00001');
  });

  it('ignora formatos inválidos', () => {
    expect(siguienteNumeroComprobante('V', 'V00001')).toBe('V-00001');
    expect(siguienteNumeroComprobante('V', 'venta-1')).toBe('V-00001');
  });
});
