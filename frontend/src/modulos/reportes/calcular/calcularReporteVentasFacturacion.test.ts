import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { FORMAS_PAGO_SEMILLA } from '../../../datos/formasPago';
import type { MovimientoCuentaCorriente } from '../../../tipos/cuentaCorriente';
import type { VentaRegistrada } from '../../../tipos/venta';
import { ESTADO_FACTURACION_PENDIENTE } from '../../../tipos/venta';
import { filtrosReporteVistaPorDefecto } from '../filtroEntidadReporte';
import { calcularReporteVentasFacturacion } from './calcularReporteVentasFacturacion';

function ventaBase(parcial: Partial<VentaRegistrada> = {}): VentaRegistrada {
  return {
    id: '000001',
    numero: 'V-00001',
    fecha: '2026-05-10T14:00:00.000Z',
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
    lineas: [],
    observaciones: '',
    registradoPor: { idUsuario: '000001', etiquetaUsuario: 'admin' },
    ...parcial,
  };
}

function pagoCc(parcial: Partial<MovimientoCuentaCorriente> = {}): MovimientoCuentaCorriente {
  return {
    id: '000101',
    clienteId: '000010',
    fecha: '2026-05-20T15:00:00.000Z',
    tipoMovimiento: 'pagoRegistrado',
    importe: 1000,
    descripcion: 'Pago registrado',
    auditoriaPago: {
      marcaTiempoUtcRegistroCliente: '2026-05-20T15:00:00.000Z',
      codigoPublicoRecibo: 'REC-001',
      etiquetaUsuarioRegistrante: 'admin',
      idUsuarioSesionRegistrante: '000001',
      canalCapturaDocumentado: 'interfaz_web_erp',
      formaDePagoEtiqueta: 'Efectivo',
      referenciaDelPagoOpcional: null,
    },
    ...parcial,
  };
}

const filtroMayo = {
  ...filtrosReporteVistaPorDefecto(),
  fechaDesde: '2026-05-01',
  fechaHasta: '2026-05-31',
};

const incluirFacturable = (codigo: string): boolean =>
  FORMAS_PAGO_SEMILLA.find((f) => f.codigo === codigo)?.facturar ?? true;

describe('calcularReporteVentasFacturacion', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('excluye ventas en cuenta corriente sin cobro facturable en el período', () => {
    const ventas = [ventaBase({ formaPago: 'CUENTA_CORRIENTE' })];
    const datos = calcularReporteVentasFacturacion(
      ventas,
      [],
      filtroMayo,
      [],
      incluirFacturable,
      [],
      FORMAS_PAGO_SEMILLA,
    );
    expect(datos.filas).toHaveLength(0);
  });

  it('incluye venta en CC cuando se cobra en el período con medio facturable', () => {
    const ventas = [
      ventaBase({ id: '000001', numero: 'V-00001', formaPago: 'CUENTA_CORRIENTE', total: 5000 }),
    ];
    const movimientos = [pagoCc({ importe: 5000, fecha: '2026-05-20T15:00:00.000Z' })];

    const datos = calcularReporteVentasFacturacion(
      ventas,
      [],
      filtroMayo,
      [],
      incluirFacturable,
      movimientos,
      FORMAS_PAGO_SEMILLA,
    );

    expect(datos.filas).toHaveLength(1);
    expect(datos.filas[0].numeroVenta).toBe('V-00001');
    expect(datos.filas[0].formaPago).toBe('Efectivo');
    expect(datos.filas[0].importeNeto).toBe(5000);
  });

  it('no incluye cobros con medio no facturable', () => {
    const ventas = [
      ventaBase({ id: '000001', numero: 'V-00001', formaPago: 'CUENTA_CORRIENTE', total: 5000 }),
    ];
    const movimientos = [
      pagoCc({
        auditoriaPago: {
          marcaTiempoUtcRegistroCliente: '2026-05-20T15:00:00.000Z',
          codigoPublicoRecibo: 'REC-002',
          etiquetaUsuarioRegistrante: 'admin',
          idUsuarioSesionRegistrante: '000001',
          canalCapturaDocumentado: 'interfaz_web_erp',
          formaDePagoEtiqueta: 'Otro',
          referenciaDelPagoOpcional: null,
        },
      }),
    ];

    const datos = calcularReporteVentasFacturacion(
      ventas,
      [],
      filtroMayo,
      [],
      incluirFacturable,
      movimientos,
      FORMAS_PAGO_SEMILLA,
    );

    expect(datos.filas).toHaveLength(0);
  });

  it('sigue excluyendo ventas con forma de pago marcada como no facturable', () => {
    const ventas = [ventaBase({ formaPago: 'CUENTA_CORRIENTE', fecha: '2026-05-15T12:00:00.000Z' })];
    const datos = calcularReporteVentasFacturacion(
      ventas,
      [],
      { ...filtroMayo, fechaDesde: '2026-05-15', fechaHasta: '2026-05-15' },
      [],
      incluirFacturable,
      [],
      FORMAS_PAGO_SEMILLA,
    );
    expect(datos.filas).toHaveLength(0);
  });
});
