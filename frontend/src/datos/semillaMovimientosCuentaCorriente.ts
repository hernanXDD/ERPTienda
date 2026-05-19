import type { MovimientoCuentaCorriente } from '../tipos/cuentaCorriente';

/**
 * Movimientos demo para clientes con CC habilitada (ids alineados con `semillaClientes`).
 * Saldo deudor = suma(cargos) − suma(pagos).
 */
export function crearSemillaMovimientosCuentaCorriente(): MovimientoCuentaCorriente[] {
  return [
    {
      id: 'mcc-00001',
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      fecha: '2026-03-01T10:00:00.000Z',
      tipoMovimiento: 'cargo',
      importe: 180_000,
      descripcion: 'Venta en cuenta corriente',
    },
    {
      id: 'mcc-00002',
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      fecha: '2026-04-10T14:30:00.000Z',
      tipoMovimiento: 'pagoRegistrado',
      importe: 50_000,
      descripcion: 'Transferencia bancaria',
    },
    {
      id: 'mcc-00003',
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      fecha: '2026-05-01T09:15:00.000Z',
      tipoMovimiento: 'cargo',
      importe: 92_000,
      descripcion: 'Venta en cuenta corriente',
    },
    {
      id: 'mcc-00004',
      clienteId: 'cli00001-0000-4000-8000-000000000003',
      fecha: '2026-02-20T11:00:00.000Z',
      tipoMovimiento: 'cargo',
      importe: 890_000,
      descripcion: 'Factura mayorista',
    },
    {
      id: 'mcc-00005',
      clienteId: 'cli00001-0000-4000-8000-000000000003',
      fecha: '2026-03-05T16:00:00.000Z',
      tipoMovimiento: 'pagoRegistrado',
      importe: 400_000,
      descripcion: 'Cheque',
    },
    {
      id: 'mcc-00006',
      clienteId: 'cli00001-0000-4000-8000-000000000005',
      fecha: '2026-04-22T12:00:00.000Z',
      tipoMovimiento: 'cargo',
      importe: 125_000,
      descripcion: 'Venta en cuenta corriente',
    },
    {
      id: 'mcc-00007',
      clienteId: 'cli00001-0000-4000-8000-000000000006',
      fecha: '2026-01-15T10:00:00.000Z',
      tipoMovimiento: 'cargo',
      importe: 310_000,
      descripcion: 'Venta en cuenta corriente',
    },
    {
      id: 'mcc-00008',
      clienteId: 'cli00001-0000-4000-8000-000000000006',
      fecha: '2026-04-01T09:00:00.000Z',
      tipoMovimiento: 'pagoRegistrado',
      importe: 310_000,
      descripcion: 'Pago total período',
    },
  ];
}
