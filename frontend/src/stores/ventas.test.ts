import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ESTADO_FACTURACION_PENDIENTE } from '../tipos/venta';

vi.mock('../servicios/ventas.servicio', () => ({
  listarVentasApi: vi.fn(),
  registrarVentaApi: vi.fn(),
  cargarFacturacionesApi: vi.fn(),
}));

vi.mock('../utilidades/registroOperadorSesion', () => ({
  crearRegistroOperadorDesdeSesion: () => ({
    idUsuario: '000001',
    etiquetaUsuario: 'admin',
  }),
}));

import { listarVentasApi, registrarVentaApi } from '../servicios/ventas.servicio';
import { useVentasStore } from './ventas';

describe('useVentasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('carga ventas desde la API una sola vez', async () => {
    vi.mocked(listarVentasApi).mockResolvedValue([
      {
        id: '000001',
        numero: 'V-00001',
        fecha: '2026-05-01T12:00:00.000Z',
        clienteId: null,
        nombreClienteMostrar: 'Consumidor final',
        documentoClienteMostrar: '',
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
      },
    ]);

    const store = useVentasStore();
    await store.cargarVentas();
    await store.cargarVentas();

    expect(listarVentasApi).toHaveBeenCalledTimes(1);
    expect(store.ventas).toHaveLength(1);
    expect(store.ventas[0]?.numero).toBe('V-00001');
  });

  it('agrega venta registrada al inicio de la lista', async () => {
    vi.mocked(registrarVentaApi).mockResolvedValue({
      id: '000002',
      numero: 'V-00002',
      fecha: '2026-05-02T12:00:00.000Z',
      clienteId: null,
      nombreClienteMostrar: 'Consumidor final',
      documentoClienteMostrar: '',
      condicionIvaCliente: 'CONSUMIDOR_FINAL',
      formaPago: 'EFECTIVO',
      subtotal: 500,
      ajusteMonto: 0,
      ajustePorcentaje: null,
      total: 500,
      facturacion: '',
      estadoFacturacion: ESTADO_FACTURACION_PENDIENTE,
      lineas: [],
      observaciones: '',
    });

    const store = useVentasStore();
    const venta = await store.registrarVenta({
      clienteId: null,
      nombreClienteMostrar: 'Consumidor final',
      formaPago: 'EFECTIVO',
      total: 500,
      lineas: [],
      observaciones: '',
    });

    expect(venta.numero).toBe('V-00002');
    expect(store.ventas[0]?.id).toBe('000002');
  });

  it('reinicia estado al cerrar sesión', () => {
    const store = useVentasStore();
    store.ventas = [
      {
        id: '000001',
        numero: 'V-00001',
        fecha: '2026-05-01T12:00:00.000Z',
        clienteId: null,
        nombreClienteMostrar: 'Consumidor final',
        documentoClienteMostrar: '',
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
        registradoPor: { idUsuario: null, etiquetaUsuario: '—' },
      },
    ];
    store.errorVentas = 'error previo';

    store.reiniciar();

    expect(store.ventas).toHaveLength(0);
    expect(store.errorVentas).toBeNull();
  });
});
