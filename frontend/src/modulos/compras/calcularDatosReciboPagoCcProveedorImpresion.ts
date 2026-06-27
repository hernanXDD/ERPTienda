import type { Proveedor } from '../../tipos/proveedor';
import type { MovimientoCuentaCorrienteProveedor } from '../../tipos/cuentaCorrienteProveedor';
import { formatearFechaDiaMesAnio, formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import { obtenerEmisorNegocioReporte, type EmisorNegocioReporte } from '../reportes/emisorNegocioReporte';
import { formatearMoneda } from '../../utilidades/formatoMoneda';

export interface DatosReciboPagoCcProveedorImpresion extends EmisorNegocioReporte {
  tituloDocumento: string;
  codigoRecibo: string;
  proveedorNombre: string;
  proveedorDocumento: string;
  importe: string;
  fechaPago: string;
  formaPago: string;
  concepto: string;
  referenciaPago: string;
  tieneReferenciaPago: boolean;
  tieneAuditoria: boolean;
  registradoEl: string;
  operador: string;
  canal: string;
  generadoEl: string;
  notaSinAuditoria: string;
  tieneNotaSinAuditoria: boolean;
}

export function calcularDatosReciboPagoCcProveedorImpresion(
  proveedor: Pick<Proveedor, 'nombre' | 'documento'>,
  movimiento: MovimientoCuentaCorrienteProveedor,
): DatosReciboPagoCcProveedorImpresion {
  if (movimiento.tipoMovimiento !== 'pagoRegistrado') {
    throw new Error('Sólo los movimientos de tipo pago admiten comprobante de pago.');
  }

  const aud = movimiento.auditoriaPago;
  const codigoRecibo = aud?.codigoPublicoRecibo?.trim()
    ? aud.codigoPublicoRecibo
    : `Pago · ref. ${movimiento.id.slice(0, 8)}`;

  const formaPagoCruda = aud?.formaDePagoEtiqueta?.trim();
  const referenciaPago = aud?.referenciaDelPagoOpcional?.trim() ?? '';

  return {
    ...obtenerEmisorNegocioReporte(),
    tituloDocumento: 'Comprobante de pago · cuenta proveedor',
    codigoRecibo,
    proveedorNombre: proveedor.nombre,
    proveedorDocumento: proveedor.documento,
    importe: formatearMoneda(movimiento.importe),
    fechaPago: formatearFechaDiaMesAnio(movimiento.fecha),
    formaPago: formaPagoCruda && formaPagoCruda.length > 0 ? formaPagoCruda : '—',
    concepto: movimiento.descripcion.trim() || 'Pago registrado',
    referenciaPago,
    tieneReferenciaPago: referenciaPago.length > 0,
    tieneAuditoria: Boolean(aud),
    registradoEl: aud ? formatearFechaYHora(aud.marcaTiempoUtcRegistroCliente) : '—',
    operador: aud?.etiquetaUsuarioRegistrante?.trim() || '—',
    canal: aud?.canalCapturaDocumentado?.trim() || '—',
    generadoEl: formatearFechaYHora(new Date()),
    notaSinAuditoria:
      'Este pago no tiene código numerado (carga histórica o migración). El comprobante refleja los datos del movimiento en cuenta corriente.',
    tieneNotaSinAuditoria: !aud,
  };
}
