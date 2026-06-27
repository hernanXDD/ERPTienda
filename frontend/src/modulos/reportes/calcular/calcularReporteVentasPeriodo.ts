import type { VentaRegistrada } from '../../../tipos/venta';
import type { FormaPago } from '../../../tipos/formaPago';
import { etiquetaEstadoFacturacion } from '../../../datos/condicionesIva';
import { etiquetaFormaPago } from '../../../datos/formasPago';
import { formatearFechaDiaMesAnio } from '../../../utilidades/formatoFechaHora';
import {
  cumpleFiltroCliente,
  cumpleFiltroEstadoFacturacion,
  etiquetaFiltroClienteLegible,
  etiquetaFiltroEstadoFacturacionLegible,
  type FiltrosReporteConCliente,
  type OpcionEntidadReporte,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas } from '../filtroFechasReporte';
import {
  formatearMonedaReporte,
  formatearNumeroReporte,
  formatearPorcentajeReporte,
} from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

export interface FilaFormaPagoReporte {
  etiqueta: string;
  cantidad: string;
  importe: string;
  porcentaje: string;
}

export interface FilaVentaReporte {
  numero: string;
  fecha: string;
  cliente: string;
  formaPago: string;
  estadoFacturacion: string;
  facturacion: string;
  total: string;
}

export interface FiltrosReporteVentasPeriodo extends FiltrosReporteConCliente {
  idEstadoFacturacion: string;
}

export interface DatosReporteVentasPeriodo {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  filtroEntidadLegible: string;
  filtroEstadoFacturacionLegible: string;
  generadoEl: string;
  totalVentas: string;
  cantidadOperaciones: string;
  ticketPromedio: string;
  unidadesVendidas: string;
  filasFormaPago: FilaFormaPagoReporte[];
  filasVentas: FilaVentaReporte[];
  sinVentas: boolean;
}

export function calcularReporteVentasPeriodo(
  ventas: VentaRegistrada[],
  filtro: FiltrosReporteVentasPeriodo,
  opcionesCliente: OpcionEntidadReporte[],
  formasPago?: FormaPago[],
): DatosReporteVentasPeriodo {
  const enPeriodo = ventas
    .filter(
      (v) =>
        estaEnRangoFechas(v.fecha, filtro) &&
        cumpleFiltroCliente(filtro.idCliente, v.clienteId) &&
        cumpleFiltroEstadoFacturacion(filtro.idEstadoFacturacion, v.estadoFacturacion)
    )
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalImporte = enPeriodo.reduce((a, v) => a + v.total, 0);
  const unidades = enPeriodo.reduce(
    (a, v) => a + v.lineas.reduce((s, ln) => s + ln.cantidad, 0),
    0
  );
  const cantidad = enPeriodo.length;
  const ticket = cantidad > 0 ? totalImporte / cantidad : 0;

  const acumFormaPago = new Map<string, { cantidad: number; importe: number }>();
  for (const v of enPeriodo) {
    const prev = acumFormaPago.get(v.formaPago) ?? { cantidad: 0, importe: 0 };
    acumFormaPago.set(v.formaPago, {
      cantidad: prev.cantidad + 1,
      importe: prev.importe + v.total,
    });
  }

  const filasFormaPago: FilaFormaPagoReporte[] = [...acumFormaPago.entries()]
    .sort((a, b) => b[1].importe - a[1].importe)
    .map(([id, datos]) => ({
      etiqueta: etiquetaFormaPago(id as VentaRegistrada['formaPago'], formasPago),
      cantidad: formatearNumeroReporte(datos.cantidad),
      importe: formatearMonedaReporte(datos.importe),
      porcentaje: formatearPorcentajeReporte(datos.importe, totalImporte),
    }));

  const filasVentas: FilaVentaReporte[] = enPeriodo.map((v) => ({
    numero: v.numero,
    fecha: formatearFechaDiaMesAnio(v.fecha),
    cliente: v.nombreClienteMostrar,
    formaPago: etiquetaFormaPago(v.formaPago, formasPago),
    estadoFacturacion: etiquetaEstadoFacturacion(v.estadoFacturacion),
    facturacion: v.facturacion?.trim() || '—',
    total: formatearMonedaReporte(v.total),
  }));

  const filtroEntidadLegible = etiquetaFiltroClienteLegible(filtro.idCliente, opcionesCliente);
  const filtroEstadoFacturacionLegible = etiquetaFiltroEstadoFacturacionLegible(
    filtro.idEstadoFacturacion
  );

  return {
    tituloReporte: 'Ventas por período',
    ...metadatosComunesReporte(filtro, filtroEntidadLegible),
    filtroEstadoFacturacionLegible,
    totalVentas: formatearMonedaReporte(totalImporte),
    cantidadOperaciones: formatearNumeroReporte(cantidad),
    ticketPromedio: formatearMonedaReporte(ticket),
    unidadesVendidas: formatearNumeroReporte(unidades),
    filasFormaPago,
    filasVentas,
    sinVentas: enPeriodo.length === 0,
  };
}
