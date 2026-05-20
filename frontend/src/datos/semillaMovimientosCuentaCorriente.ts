import type { MovimientoCuentaCorriente } from '../tipos/cuentaCorriente';
import { REGISTRO_ADMIN, REGISTRO_DUENO, REGISTRO_EMPLEADO } from './idsUsuariosSemilla';

function iso(diasAtras: number, horaH = 10, horaM = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(horaH, horaM, 0, 0);
  return d.toISOString();
}

/**
 * Movimientos demo para clientes con CC habilitada (ids alineados con `semillaClientes`).
 * Saldo deudor = suma(cargos) − suma(pagos).
 */
export function crearSemillaMovimientosCuentaCorriente(): MovimientoCuentaCorriente[] {
  return [
    {
      id: 'mcc-00001',
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      fecha: iso(45, 10, 0),
      tipoMovimiento: 'cargo',
      importe: 180_000,
      descripcion: 'Venta en cuenta corriente',
      registradoPor: REGISTRO_DUENO,
    },
    {
      id: 'mcc-00002',
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      fecha: iso(20, 14, 30),
      tipoMovimiento: 'pagoRegistrado',
      importe: 50_000,
      descripcion: 'Transferencia bancaria',
      auditoriaPago: {
        marcaTiempoUtcRegistroCliente: iso(20, 14, 30),
        codigoPublicoRecibo: 'REC-CC-00001',
        etiquetaUsuarioRegistrante: 'admin',
        idUsuarioSesionRegistrante: REGISTRO_ADMIN.idUsuario,
        canalCapturaDocumentado: 'interfaz_web_erp',
        formaDePagoEtiqueta: 'Transferencia bancaria',
        referenciaDelPagoOpcional: null,
      },
    },
    {
      id: 'mcc-00003',
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      fecha: iso(5, 9, 15),
      tipoMovimiento: 'cargo',
      importe: 92_000,
      descripcion: 'Venta en cuenta corriente',
      registradoPor: REGISTRO_EMPLEADO,
    },
    {
      id: 'mcc-00004',
      clienteId: 'cli00001-0000-4000-8000-000000000003',
      fecha: iso(60, 11, 0),
      tipoMovimiento: 'cargo',
      importe: 890_000,
      descripcion: 'Factura mayorista',
      registradoPor: REGISTRO_ADMIN,
    },
    {
      id: 'mcc-00005',
      clienteId: 'cli00001-0000-4000-8000-000000000003',
      fecha: iso(35, 16, 0),
      tipoMovimiento: 'pagoRegistrado',
      importe: 400_000,
      descripcion: 'Cheque',
      auditoriaPago: {
        marcaTiempoUtcRegistroCliente: iso(35, 16, 0),
        codigoPublicoRecibo: 'REC-CC-00002',
        etiquetaUsuarioRegistrante: 'dueño',
        idUsuarioSesionRegistrante: REGISTRO_DUENO.idUsuario,
        canalCapturaDocumentado: 'interfaz_web_erp',
        formaDePagoEtiqueta: 'Cheque',
        referenciaDelPagoOpcional: 'CH-8821',
      },
    },
    {
      id: 'mcc-00006',
      clienteId: 'cli00001-0000-4000-8000-000000000005',
      fecha: iso(12, 12, 0),
      tipoMovimiento: 'cargo',
      importe: 125_000,
      descripcion: 'Venta en cuenta corriente',
      registradoPor: REGISTRO_EMPLEADO,
    },
    {
      id: 'mcc-00007',
      clienteId: 'cli00001-0000-4000-8000-000000000006',
      fecha: iso(70, 10, 0),
      tipoMovimiento: 'cargo',
      importe: 310_000,
      descripcion: 'Venta en cuenta corriente',
      registradoPor: REGISTRO_DUENO,
    },
    {
      id: 'mcc-00008',
      clienteId: 'cli00001-0000-4000-8000-000000000006',
      fecha: iso(25, 9, 0),
      tipoMovimiento: 'pagoRegistrado',
      importe: 310_000,
      descripcion: 'Pago total período',
      auditoriaPago: {
        marcaTiempoUtcRegistroCliente: iso(25, 9, 0),
        codigoPublicoRecibo: 'REC-CC-00003',
        etiquetaUsuarioRegistrante: 'empleado',
        idUsuarioSesionRegistrante: REGISTRO_EMPLEADO.idUsuario,
        canalCapturaDocumentado: 'interfaz_web_erp',
        formaDePagoEtiqueta: 'Efectivo',
        referenciaDelPagoOpcional: null,
      },
    },
  ];
}
