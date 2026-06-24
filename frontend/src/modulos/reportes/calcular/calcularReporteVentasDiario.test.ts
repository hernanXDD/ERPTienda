import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import type { VentaRegistrada } from '../../../tipos/venta';
import { ESTADO_FACTURACION_PENDIENTE } from '../../../tipos/venta';
import { calcularReporteVentasDiario } from './calcularReporteVentasDiario';

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
    subtotal: 1000,
    ajusteMonto: 0,
    ajustePorcentaje: null,
    total: 1000,
    facturacion: '',
    estadoFacturacion: ESTADO_FACTURACION_PENDIENTE,
    lineas: [{ varianteId: '000101', nombre: 'Remera', cantidad: 2, precioUnitario: 500, subtotal: 1000 }],
    observaciones: '',
    registradoPor: { idUsuario: '000001', etiquetaUsuario: 'admin' },
    ...parcial,
  };
}

describe('calcularReporteVentasDiario', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const filtroHoy = {
    fechaDesde: '2026-05-15',
    fechaHasta: '2026-05-15',
    idCliente: '',
    idEstadoFacturacion: '',
  };

  it('lista ventas del día con hora y totales', () => {
    const ventas = [
      ventaBase({ id: '000001', numero: 'V-00001', total: 1000 }),
      ventaBase({ id: '000002', numero: 'V-00002', total: 2500, fecha: '2026-05-15T18:30:00.000Z' }),
      ventaBase({ id: '000003', numero: 'V-00003', total: 500, fecha: '2026-05-14T10:00:00.000Z' }),
    ];

    const datos = calcularReporteVentasDiario(ventas, filtroHoy, []);

    expect(datos.tituloReporte).toBe('Ventas del día');
    expect(datos.cantidadOperaciones).toBe('2');
    expect(datos.totalVentas).toContain('3');
    expect(datos.filasVentas).toHaveLength(2);
    expect(datos.filasVentas[0]?.numero).toBe('V-00002');
    expect(datos.filasVentas[0]?.hora).toBeTruthy();
    expect(datos.sinVentas).toBe(false);
  });

  it('indica cuando no hay ventas en el día', () => {
    const datos = calcularReporteVentasDiario([], filtroHoy, []);

    expect(datos.sinVentas).toBe(true);
    expect(datos.filasVentas).toHaveLength(0);
  });
});
