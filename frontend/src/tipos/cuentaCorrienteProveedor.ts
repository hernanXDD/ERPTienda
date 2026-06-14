import type { RegistroOperador } from './registroOperador';

export type TipoMovimientoCuentaCorrienteProveedor = 'cargo' | 'pagoRegistrado';

export interface AuditoriaPagoCuentaCorrienteProveedor {
  marcaTiempoUtcRegistroCliente: string;
  codigoPublicoRecibo: string;
  etiquetaUsuarioRegistrante: string;
  idUsuarioSesionRegistrante: string | null;
  canalCapturaDocumentado: 'interfaz_web_erp';
  formaDePagoEtiqueta: string;
  referenciaDelPagoOpcional: string | null;
}

export interface MovimientoCuentaCorrienteProveedor {
  id: string;
  proveedorId: string;
  fecha: string;
  tipoMovimiento: TipoMovimientoCuentaCorrienteProveedor;
  importe: number;
  descripcion: string;
  auditoriaPago?: AuditoriaPagoCuentaCorrienteProveedor;
  registradoPor?: RegistroOperador;
}
