import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';
import type { Cliente } from '../../tipos/cliente';
import { formatearFechaDiaMesAnio, formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import { obtenerEmisorNegocioReporte, type EmisorNegocioReporte } from '../reportes/emisorNegocioReporte';

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export interface DatosReciboPagoCcImpresion extends EmisorNegocioReporte {
  tituloDocumento: string;
  codigoRecibo: string;
  clienteNombre: string;
  clienteDocumento: string;
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

export function calcularDatosReciboPagoCcImpresion(
  cliente: Pick<Cliente, 'nombre' | 'documento'>,
  movimiento: MovimientoCuentaCorriente,
): DatosReciboPagoCcImpresion {
  if (movimiento.tipoMovimiento !== 'pagoRegistrado') {
    throw new Error('Sólo los movimientos de tipo pago admiten recibo de cobro.');
  }

  const aud = movimiento.auditoriaPago;
  const codigoRecibo = aud?.codigoPublicoRecibo?.trim()
    ? aud.codigoPublicoRecibo
    : `Pago · ref. ${movimiento.id.slice(0, 8)}`;

  const formaPagoCruda = aud?.formaDePagoEtiqueta?.trim();
  const referenciaPago = aud?.referenciaDelPagoOpcional?.trim() ?? '';

  return {
    ...obtenerEmisorNegocioReporte(),
    tituloDocumento: 'Recibo de cobro · cuenta corriente',
    codigoRecibo,
    clienteNombre: cliente.nombre,
    clienteDocumento: cliente.documento,
    importe: formatoMoneda.format(movimiento.importe),
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
      'Este pago no tiene código de recibo numerado (carga histórica o migración). El comprobante refleja los datos del movimiento en cuenta corriente.',
    tieneNotaSinAuditoria: !aud,
  };
}
