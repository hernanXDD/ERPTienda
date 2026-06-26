import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Cliente } from '../../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../../tipos/cuentaCorriente';
import type { VentaRegistrada } from '../../../tipos/venta';
import { renderizarPlantillaReporte } from '../motorEtaReportes';
import { plantillasReportes } from '../plantillasReportes';
import { useNegocioStore } from '../../../stores/negocio';
import { calcularReporteCuentasCorrientes } from './calcularReporteCuentasCorrientes';

function clienteBase(parcial: Partial<Cliente> = {}): Cliente {
  return {
    id: '000010',
    nombre: 'Cliente CC',
    documento: '20123456789',
    condicionIva: 'CONSUMIDOR_FINAL',
    correoElectronico: '',
    telefonoPrincipal: '',
    telefonoAlternativo: '',
    direccion: '',
    limiteCompraCuentaCorriente: 50000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
    ...parcial,
  };
}

describe('calcularReporteCuentasCorrientes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const filtro = {
    fechaDesde: '2026-05-01',
    fechaHasta: '2026-05-31',
    idCliente: '',
  };

  it('calcula saldos, movimientos del período y deuda total', () => {
    const clientes = [clienteBase()];
    const movimientos: MovimientoCuentaCorriente[] = [
      {
        id: '000001',
        clienteId: '000010',
        fecha: '2026-04-20T12:00:00.000Z',
        tipoMovimiento: 'cargo',
        importe: 1000,
        descripcion: 'Saldo previo',
      },
      {
        id: '000002',
        clienteId: '000010',
        fecha: '2026-05-10T12:00:00.000Z',
        tipoMovimiento: 'cargo',
        importe: 2000,
        descripcion: 'Venta V-00001',
      },
      {
        id: '000003',
        clienteId: '000010',
        fecha: '2026-05-15T12:00:00.000Z',
        tipoMovimiento: 'pagoRegistrado',
        importe: 500,
        descripcion: 'Pago parcial',
      },
    ];

    const reporte = calcularReporteCuentasCorrientes(clientes, movimientos, filtro, []);

    expect(reporte.sinClientes).toBe(false);
    expect(reporte.clientes).toHaveLength(1);
    expect(reporte.clientes[0]?.saldoInicial).toContain('1.000');
    expect(reporte.clientes[0]?.cargosPeriodo).toContain('2.000');
    expect(reporte.clientes[0]?.pagosPeriodo).toContain('500');
    expect(reporte.clientes[0]?.saldoFinal).toContain('2.500');
    expect(reporte.clientes[0]?.claseSaldo).toBe('rep-chip-deuda');
    expect(reporte.clientes[0]?.movimientos).toHaveLength(2);
    expect(reporte.totalDeuda).toContain('2.500');
    expect(reporte.clientesConSaldo).toBe('1');
  });

  it('excluye clientes sin cuenta corriente habilitada', () => {
    const clientes = [clienteBase({ cuentaCorrienteHabilitada: false })];
    const reporte = calcularReporteCuentasCorrientes(clientes, [], filtro, []);

    expect(reporte.sinClientes).toBe(true);
    expect(reporte.clientes).toHaveLength(0);
  });

  it('ordena clientes por saldo final descendente', () => {
    const clientes = [
      clienteBase({ id: '000010', nombre: 'Menor deuda' }),
      clienteBase({ id: '000011', nombre: 'Mayor deuda' }),
    ];
    const movimientos: MovimientoCuentaCorriente[] = [
      {
        id: '000001',
        clienteId: '000010',
        fecha: '2026-05-05T12:00:00.000Z',
        tipoMovimiento: 'cargo',
        importe: 100,
        descripcion: 'Cargo A',
      },
      {
        id: '000002',
        clienteId: '000011',
        fecha: '2026-05-05T12:00:00.000Z',
        tipoMovimiento: 'cargo',
        importe: 900,
        descripcion: 'Cargo B',
      },
    ];

    const reporte = calcularReporteCuentasCorrientes(clientes, movimientos, filtro, []);

    expect(reporte.clientes[0]?.nombre).toBe('Mayor deuda');
    expect(reporte.clientes[1]?.nombre).toBe('Menor deuda');
  });

  it('incluye detalle de productos en cargos vinculados a ventas en cuenta corriente', () => {
    const clientes = [clienteBase()];
    const movimientos: MovimientoCuentaCorriente[] = [
      {
        id: '000002',
        clienteId: '000010',
        fecha: '2026-05-10T12:00:00.000Z',
        tipoMovimiento: 'cargo',
        importe: 15000,
        descripcion: 'Venta V-00001',
      },
    ];
    const ventas: VentaRegistrada[] = [
      {
        id: '000100',
        numero: 'V-00001',
        fecha: '2026-05-10T12:00:00.000Z',
        clienteId: '000010',
        nombreClienteMostrar: 'Cliente CC',
        documentoClienteMostrar: '20123456789',
        condicionIvaCliente: 'CONSUMIDOR_FINAL',
        formaPago: 'CUENTA_CORRIENTE',
        subtotal: 15000,
        ajusteMonto: 0,
        ajustePorcentaje: null,
        total: 15000,
        facturacion: '',
        estadoFacturacion: { id: '000001', codigo: 'PENDIENTE', nombre: 'Pendiente' },
        lineas: [
          {
            id: '000200',
            varianteId: '000300',
            nombre: 'Remera M',
            cantidad: 2,
            precioUnitario: 5000,
            subtotal: 10000,
          },
          {
            id: '000201',
            varianteId: '000301',
            nombre: 'Pantalón 42',
            cantidad: 1,
            precioUnitario: 5000,
            subtotal: 5000,
          },
        ],
        observaciones: '',
        registradoPor: { idUsuario: null, etiquetaUsuario: 'admin' },
      },
    ];

    const reporte = calcularReporteCuentasCorrientes(clientes, movimientos, filtro, [], ventas);
    const movimiento = reporte.clientes[0]?.movimientos[0];

    expect(movimiento?.tieneDetalleOperacion).toBe(true);
    expect(movimiento?.detalleOperacion?.lineas).toHaveLength(2);
    expect(movimiento?.detalleOperacion?.lineas[0]?.nombre).toBe('Remera M');
    expect(movimiento?.detalleOperacion?.total).toContain('15.000');
  });

  it('renderiza la plantilla ETA con detalle de productos sin error', () => {
    useNegocioStore().$patch({
      negocio: {
        nombre: 'Negocio Test',
        cuit: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        telefono: '',
        correoElectronico: '',
        tieneLogo: false,
        logoVersion: 0,
        instagram: '',
        mostrarInstagram: false,
        twitter: '',
        mostrarTwitter: false,
        tiktok: '',
        mostrarTiktok: false,
      } as import('../../../tipos/negocio').Negocio,
    });

    const clientes = [clienteBase()];
    const movimientos: MovimientoCuentaCorriente[] = [
      {
        id: '000002',
        clienteId: '000010',
        fecha: '2026-05-10T12:00:00.000Z',
        tipoMovimiento: 'cargo',
        importe: 15000,
        descripcion: 'Venta V-00001',
      },
    ];
    const ventas: VentaRegistrada[] = [
      {
        id: '000100',
        numero: 'V-00001',
        fecha: '2026-05-10T12:00:00.000Z',
        clienteId: '000010',
        nombreClienteMostrar: 'Cliente CC',
        documentoClienteMostrar: '20123456789',
        condicionIvaCliente: 'CONSUMIDOR_FINAL',
        formaPago: 'CUENTA_CORRIENTE',
        subtotal: 15000,
        ajusteMonto: 0,
        ajustePorcentaje: null,
        total: 15000,
        facturacion: '',
        estadoFacturacion: { id: '000001', codigo: 'PENDIENTE', nombre: 'Pendiente' },
        lineas: [
          {
            id: '000200',
            varianteId: '000300',
            nombre: 'Remera & Co',
            cantidad: 1,
            precioUnitario: 15000,
            subtotal: 15000,
          },
        ],
        observaciones: '',
        registradoPor: { idUsuario: null, etiquetaUsuario: 'admin' },
      },
    ];

    const datos = calcularReporteCuentasCorrientes(clientes, movimientos, filtro, [], ventas);
    const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes'], datos);

    expect(html).toContain('Detalle de productos');
    expect(html).toContain('rep-cc-productos');
    expect(html).toContain('Remera &amp; Co');
    expect(html).toContain('Cargo</th>');
    expect(html).toContain('class="rep-doc"');
  });
});
