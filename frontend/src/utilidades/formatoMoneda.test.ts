import { describe, expect, it } from 'vitest';
import {
  formatearDecimal,
  formatearMoneda,
  formatearMonedaFacturacion,
  formatearNumero,
} from './formatoMoneda';

describe('formatoMoneda', () => {
  it('formatea moneda de pantalla sin decimales', () => {
    expect(formatearMoneda(7300)).toMatch(/7\.?300/);
    expect(formatearMoneda(7300)).toContain('$');
  });

  it('devuelve guión para valores no finitos', () => {
    expect(formatearMoneda(Number.NaN)).toBe('—');
    expect(formatearMoneda(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('formatea moneda de facturación con 2 decimales', () => {
    const texto = formatearMonedaFacturacion(1234.5);
    expect(texto).toContain('$');
    expect(texto).toMatch(/1\.?234,50/);
  });

  it('formatea números y decimales', () => {
    expect(formatearNumero(1500)).toMatch(/1\.?500/);
    expect(formatearDecimal(25.5)).toBe('25,5');
  });
});
