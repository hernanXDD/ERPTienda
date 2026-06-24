import { describe, expect, it } from 'vitest';
import type { CambioConteoPrevisto } from '../modulos/inventario/plantillaConteoFisico';
import { parsearCantidadFisica, requiereObservacionConteo } from './useConteoEnPantalla';

describe('parsearCantidadFisica', () => {
  it('acepta enteros no negativos', () => {
    expect(parsearCantidadFisica('12')).toBe(12);
    expect(parsearCantidadFisica('0')).toBe(0);
  });

  it('rechaza valores inválidos', () => {
    expect(parsearCantidadFisica('-1')).toBeNull();
    expect(parsearCantidadFisica('abc')).toBeNull();
  });
});

describe('requiereObservacionConteo', () => {
  const cambio = (delta: number): CambioConteoPrevisto => ({
    varianteId: '000001',
    codigoProducto: 'X',
    nombreProducto: 'Prod',
    cantidadAnterior: 10,
    cantidadNueva: 10 + delta,
    delta,
  });

  it('exige observación con 3 o más ítems', () => {
    expect(requiereObservacionConteo([cambio(1), cambio(1), cambio(1)])).toBe(true);
  });

  it('exige observación con bajas de stock', () => {
    expect(requiereObservacionConteo([cambio(-2)])).toBe(true);
  });

  it('no exige observación con pocos aumentos', () => {
    expect(requiereObservacionConteo([cambio(2), cambio(1)])).toBe(false);
  });
});
