import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calcularReporteCuentasCorrientes } from './calcular/calcularReporteCuentasCorrientes';
import { exportarReporteComoPdf } from './impresionReporte';
import { renderizarPlantillaReporte } from './motorEtaReportes';
import { plantillasReportes } from './plantillasReportes';
import { useNegocioStore } from '../../stores/negocio';
import type { Cliente } from '../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';
import type { VentaRegistrada } from '../../tipos/venta';

const pdfMock = {
  output: vi.fn(() => 'blob:mock-pdf'),
  internal: {
    getNumberOfPages: () => 1,
    pageSize: { getWidth: () => 210, getHeight: () => 297 },
  },
  setPage: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
};

vi.mock('html2pdf.js', () => ({
  default: () => ({
    set: () => ({
      from: () => ({
        toPdf: () => ({
          get: async () => pdfMock,
        }),
      }),
    }),
  }),
}));

describe('exportarReporteComoPdf', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
      } as import('../../tipos/negocio').Negocio,
    });
    vi.stubGlobal('open', vi.fn(
      () =>
        ({
          closed: false,
          location: { href: '' },
          close: vi.fn(),
        }) as unknown as Window,
    ));
  });

  it('exporta cuenta corriente con detalle anidado sin error', async () => {
    const clientes: Cliente[] = [
      {
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
      },
    ];
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
        ],
        observaciones: '',
        registradoPor: { idUsuario: null, etiquetaUsuario: 'admin' },
      },
    ];

    const datos = calcularReporteCuentasCorrientes(
      clientes,
      movimientos,
      { fechaDesde: '2026-01-01', fechaHasta: '2026-12-31', idCliente: '' },
      [],
      ventas,
    );
    const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes'], datos);

    await expect(exportarReporteComoPdf(html, 'test-cc')).resolves.toBeUndefined();
    expect(window.open).toHaveBeenCalled();
  });

  it('exporta con nombre de negocio con apóstrofo sin romper el HTML', async () => {
    useNegocioStore().$patch({
      negocio: {
        nombre: "Panadería O'Brien",
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
      } as import('../../tipos/negocio').Negocio,
    });

    const datos = calcularReporteCuentasCorrientes(
      [],
      [],
      { fechaDesde: '2026-01-01', fechaHasta: '2026-12-31', idCliente: '' },
      [],
      [],
    );
    const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes'], datos);

    expect(html).toContain('data-rep-pie="');
    expect(html).not.toContain("data-rep-pie='");

    await expect(exportarReporteComoPdf(html, 'test-apostrofo')).resolves.toBeUndefined();
  });
});
