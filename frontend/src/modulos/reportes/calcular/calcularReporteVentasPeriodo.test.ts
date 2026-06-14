import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import type { VentaRegistrada } from '../../../tipos/venta';
import { ESTADO_FACTURACION_PENDIENTE } from '../../../tipos/venta';
import { calcularReporteVentasPeriodo } from './calcularReporteVentasPeriodo';

function ventaBase(parcial: Partial<VentaRegistrada> = {}): VentaRegistrada {
  return {
    id: '000001',
    numero: 'V-00001',
    fecha: '2026-05-15T14:00:00.000Z',
    clienteId: '000010',
    nombreClienteMostrar: 'Cliente Demo',
    documentoClienteMostrar: '20123456789',
    condicionIvaCliente: 'CONSUMIDOR_FINAL',
    formaPago: 'EFECTIVO',
    total: 1000,
    facturacion: '',
    estadoFacturacion: ESTADO_FACTURACION_PENDIENTE,
    lineas: [{ varianteId: '000101', nombre: 'Remera', cantidad: 2, precioUnitario: 500, subtotal: 1000 }],
    observaciones: '',
    registradoPor: { idUsuario: '000001', etiquetaUsuario: 'admin' },
    ...parcial,
  };
}

describe('calcularReporteVentasPeriodo', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const filtroBase = {
    fechaDesde: '2026-05-01',
    fechaHasta: '2026-05-31',
    idCliente: '',
    idEstadoFacturacion: '',
  };

  it('calcula totales y filas para ventas del período', () => {
    const ventas = [
      ventaBase(),
      ventaBase({
        id: '000002',
        numero: 'V-00002',
        fecha: '2026-05-20T10:00:00.000Z',
        formaPago: 'DEBITO',
        total: 2500,
        lineas: [{ varianteId: '000102', nombre: 'Pantalón', cantidad: 1, precioUnitario: 2500, subtotal: 2500 }],
      }),
      ventaBase({
        id: '000003',
        numero: 'V-00003',
        fecha: '2026-04-30T10:00:00.000Z',
        total: 5000,
      }),
    ];

    const reporte = calcularReporteVentasPeriodo(ventas, filtroBase, []);

    expect(reporte.sinVentas).toBe(false);
    expect(reporte.cantidadOperaciones).toBe('2');
    expect(reporte.totalVentas).toContain('3.500');
    expect(reporte.unidadesVendidas).toBe('3');
    expect(reporte.filasVentas).toHaveLength(2);
    expect(reporte.filasVentas[0]?.numero).toBe('V-00002');
    expect(reporte.filasFormaPago).toHaveLength(2);
  });

  it('filtra por cliente y estado de facturación', () => {
    const ventas = [
      ventaBase({ clienteId: '000010' }),
      ventaBase({
        id: '000002',
        numero: 'V-00002',
        clienteId: '000011',
        nombreClienteMostrar: 'Otro',
      }),
    ];

    const reporte = calcularReporteVentasPeriodo(
      ventas,
      { ...filtroBase, idCliente: '000010' },
      [{ id: '000010', etiqueta: 'Cliente Demo' }],
    );

    expect(reporte.filasVentas).toHaveLength(1);
    expect(reporte.filtroEntidadLegible).toBe('Cliente Demo');
  });

  it('marca sinVentas cuando no hay coincidencias', () => {
    const reporte = calcularReporteVentasPeriodo([], filtroBase, []);

    expect(reporte.sinVentas).toBe(true);
    expect(reporte.cantidadOperaciones).toBe('0');
    expect(reporte.filasVentas).toHaveLength(0);
  });
});
