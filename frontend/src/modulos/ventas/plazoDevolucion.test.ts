import { describe, expect, it } from 'vitest';
import {
  diasTranscurridosDesdeVenta,
  ventaPermiteDevolucion,
} from './plazoDevolucion';

describe('plazoDevolucion', () => {
  it('calcula días transcurridos', () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(diasTranscurridosDesdeVenta(ayer)).toBe(1);
  });

  it('permite devolución dentro del plazo', () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(ventaPermiteDevolucion(ayer, 7)).toBe(true);
  });

  it('rechaza devolución fuera del plazo', () => {
    const haceDiezDias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(ventaPermiteDevolucion(haceDiezDias, 7)).toBe(false);
  });
});
