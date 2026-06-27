import {
  esFormaPagoCuentaCorriente,
  etiquetaFormaPago,
} from '../../../datos/formasPago';
import { resolverCodigoFormaPagoDesdeEtiquetaCc } from '../../clientes/resolverCodigoFormaPagoDesdeEtiquetaCc';
import type { FormaPago } from '../../../tipos/formaPago';
import type { MovimientoCuentaCorriente } from '../../../tipos/cuentaCorriente';
import type { VentaRegistrada } from '../../../tipos/venta';
import {
  cumpleFiltroCliente,
  cumpleFiltroEstadoFacturacion,
  type FiltrosReporteVista,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas } from '../filtroFechasReporte';

export interface VentaCcCobradaFacturacion {
  venta: VentaRegistrada;
  /** Fecha del cobro (pago registrado en CC). */
  fechaCobro: string;
  /** Etiqueta del medio de cobro en el recibo. */
  formaPagoCobroEtiqueta: string;
}

function compararPorFechaAsc(a: { fecha: string }, b: { fecha: string }): number {
  return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
}

function pagoEsFacturableEnReporte(
  movimiento: MovimientoCuentaCorriente,
  formas: FormaPago[],
  incluirVentaEnFacturacion: (codigoFormaPago: string) => boolean,
): boolean {
  if (movimiento.tipoMovimiento !== 'pagoRegistrado') return false;
  const etiqueta = movimiento.auditoriaPago?.formaDePagoEtiqueta?.trim() ?? '';
  const codigo = resolverCodigoFormaPagoDesdeEtiquetaCc(etiqueta, formas);
  if (!codigo) return false;
  return incluirVentaEnFacturacion(codigo);
}

/**
 * Ventas en cuenta corriente que se cobraron en el período con un medio que debe facturarse.
 * Asigna pagos a ventas del mismo cliente por orden cronológico (FIFO).
 */
export function calcularVentasCcCobradasParaFacturacion(
  ventas: VentaRegistrada[],
  movimientosCc: MovimientoCuentaCorriente[],
  filtro: FiltrosReporteVista,
  formas: FormaPago[],
  incluirVentaEnFacturacion: (codigoFormaPago: string) => boolean,
): VentaCcCobradaFacturacion[] {
  const ventasCcPorCliente = new Map<string, VentaRegistrada[]>();
  for (const venta of ventas) {
    if (!venta.clienteId || !esFormaPagoCuentaCorriente(venta.formaPago)) continue;
    if (!cumpleFiltroCliente(filtro.idCliente, venta.clienteId)) continue;
    if (!cumpleFiltroEstadoFacturacion(filtro.idEstadoFacturacion, venta.estadoFacturacion)) continue;
    const lista = ventasCcPorCliente.get(venta.clienteId) ?? [];
    lista.push(venta);
    ventasCcPorCliente.set(venta.clienteId, lista);
  }
  for (const lista of ventasCcPorCliente.values()) {
    lista.sort(compararPorFechaAsc);
  }

  const pagosFacturables = movimientosCc
    .filter(
      (m) =>
        estaEnRangoFechas(m.fecha, filtro) &&
        cumpleFiltroCliente(filtro.idCliente, m.clienteId) &&
        pagoEsFacturableEnReporte(m, formas, incluirVentaEnFacturacion),
    )
    .sort(compararPorFechaAsc);

  const cubiertoPorVenta = new Map<string, number>();
  const incluidas: VentaCcCobradaFacturacion[] = [];
  const ventasYaIncluidas = new Set<string>();

  for (const pago of pagosFacturables) {
    let restante = pago.importe;
    const etiquetaCobro =
      pago.auditoriaPago?.formaDePagoEtiqueta?.trim() ||
      etiquetaFormaPago('EFECTIVO', formas);
    const ventasCliente = ventasCcPorCliente.get(pago.clienteId) ?? [];

    for (const venta of ventasCliente) {
      if (restante <= 0) break;
      const yaCubierto = cubiertoPorVenta.get(venta.id) ?? 0;
      const pendiente = venta.total - yaCubierto;
      if (pendiente <= 0) continue;

      const asignado = Math.min(restante, pendiente);
      cubiertoPorVenta.set(venta.id, yaCubierto + asignado);
      restante -= asignado;

      if (!ventasYaIncluidas.has(venta.id) && asignado > 0) {
        ventasYaIncluidas.add(venta.id);
        incluidas.push({
          venta,
          fechaCobro: pago.fecha,
          formaPagoCobroEtiqueta: etiquetaCobro,
        });
      }
    }
  }

  return incluidas.sort(
    (a, b) => new Date(b.fechaCobro).getTime() - new Date(a.fechaCobro).getTime(),
  );
}
