import { describe, expect, it } from 'vitest';
import { normalizarImporteArgentino } from './importeArgentino';

describe('importeArgentino', () => {
  it('normaliza formato argentino con miles y decimales', () => {
    expect(normalizarImporteArgentino('1.234,50')).toBe(1234.5);
    expect(normalizarImporteArgentino('15.000')).toBe(15000);
    expect(normalizarImporteArgentino('500')).toBe(500);
  });

  it('devuelve NaN para entradas inválidas', () => {
    expect(normalizarImporteArgentino('')).toBeNaN();
    expect(normalizarImporteArgentino('abc')).toBeNaN();
  });
});
