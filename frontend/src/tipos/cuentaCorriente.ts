import type { RegistroOperador } from './registroOperador';

/** Origen del movimiento en cuenta corriente (compra a crédito, ingreso de dinero, etc.). */
export type TipoMovimientoCuentaCorriente = 'cargo' | 'pagoRegistrado';

/** Datos persistidos en pagos registrados desde la interfaz del ERP (recibo y trazabilidad). */
export interface AuditoriaPagoCuentaCorriente {
  marcaTiempoUtcRegistroCliente: string;
  codigoPublicoRecibo: string;
  etiquetaUsuarioRegistrante: string;
  idUsuarioSesionRegistrante: string | null;
  canalCapturaDocumentado: 'interfaz_web_erp';
  /** Medio de cobro elegido en el registro del pago (figura en el recibo). */
  formaDePagoEtiqueta: string;
  /** Nº de operación, cupón, cheque, etc.; opcional. */
  referenciaDelPagoOpcional: string | null;
}

export interface MovimientoCuentaCorriente {
  id: string;
  clienteId: string;
  /** Fecha/hora del movimiento (ISO 8601). */
  fecha: string;
  tipoMovimiento: TipoMovimientoCuentaCorriente;
  /** Monto siempre positivo; el significado lo da `tipoMovimiento`. */
  importe: number;
  descripcion: string;
  /** Presente cuando `tipoMovimiento` es pago cargado desde el formulario registrado por operador. */
  auditoriaPago?: AuditoriaPagoCuentaCorriente;
  /** Operador que registró el movimiento (cargos y respaldo de trazabilidad). */
  registradoPor?: RegistroOperador;
}
