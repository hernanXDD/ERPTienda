import { etiquetaFormaPago } from '../../datos/formasPago';
import type { VentaRegistrada } from '../../tipos/venta';
import {
  formatearFechaDiaMesAnio,
  formatearFechaYHora,
  formatearHoraAmPm,
} from '../../utilidades/formatoFechaHora';
import { obtenerEmisorNegocioReporte, type EmisorNegocioReporte } from '../reportes/emisorNegocioReporte';

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export interface LineaResumenVentaImpresion {
  nombre: string;
  cantidad: string;
  precioUnitario: string;
  importe: string;
}

export interface DatosResumenVentaImpresion extends EmisorNegocioReporte {
  numero: string;
  fecha: string;
  hora: string;
  cliente: string;
  lineas: LineaResumenVentaImpresion[];
  subtotalLineas: string;
  tieneAjuste: boolean;
  etiquetaAjuste: string;
  montoAjuste: string;
  ajusteEsDescuento: boolean;
  totalPagado: string;
  metodoPago: string;
  cantidadArticulos: string;
  cantidadLineas: string;
  atendidoPor: string;
  tieneAtendidoPor: boolean;
  observaciones: string;
  tieneObservaciones: boolean;
  generadoEl: string;
}

function etiquetaAtendidoPor(etiqueta: string): string {
  const limpio = etiqueta.trim();
  return limpio || '—';
}

/** Arma el objeto de datos para la plantilla Eta del comprobante de compra. */
export function calcularDatosResumenVentaImpresion(
  venta: VentaRegistrada,
): DatosResumenVentaImpresion {
  const unidades = venta.lineas.reduce((acc, ln) => acc + ln.cantidad, 0);
  const lineas = venta.lineas.length;
  const obs = venta.observaciones.trim();
  const atendido = etiquetaAtendidoPor(venta.registradoPor.etiquetaUsuario);
  const subtotal =
    venta.subtotal ?? venta.lineas.reduce((acc, ln) => acc + ln.subtotal, 0);
  const ajusteMonto = venta.ajusteMonto ?? venta.total - subtotal;
  const tieneAjuste = Math.abs(ajusteMonto) >= 0.5;
  const ajusteEsDescuento = ajusteMonto < 0;
  const porcentaje =
    venta.ajustePorcentaje ??
    (subtotal > 0 ? Math.round((Math.abs(ajusteMonto) / subtotal) * 1000) / 10 : null);
  const etiquetaAjuste =
    porcentaje != null && porcentaje > 0
      ? ajusteEsDescuento
        ? `Descuento ${porcentaje}%`
        : `Recargo ${porcentaje}%`
      : ajusteEsDescuento
        ? 'Descuento'
        : 'Recargo';

  return {
    ...obtenerEmisorNegocioReporte(),
    numero: venta.numero.trim(),
    fecha: formatearFechaDiaMesAnio(venta.fecha),
    hora: formatearHoraAmPm(venta.fecha),
    cliente: venta.nombreClienteMostrar,
    lineas: venta.lineas.map((ln) => ({
      nombre: ln.nombre,
      cantidad: String(ln.cantidad),
      precioUnitario: formatoMoneda.format(ln.precioUnitario),
      importe: formatoMoneda.format(ln.subtotal),
    })),
    subtotalLineas: formatoMoneda.format(subtotal),
    tieneAjuste,
    etiquetaAjuste,
    montoAjuste: formatoMoneda.format(Math.abs(ajusteMonto)),
    ajusteEsDescuento,
    totalPagado: formatoMoneda.format(venta.total),
    metodoPago: etiquetaFormaPago(venta.formaPago),
    cantidadArticulos: `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`,
    cantidadLineas: `${lineas} ${lineas === 1 ? 'producto' : 'productos'}`,
    atendidoPor: atendido,
    tieneAtendidoPor: atendido !== '—',
    observaciones: obs,
    tieneObservaciones: obs.length > 0,
    generadoEl: formatearFechaYHora(new Date()),
  };
}
