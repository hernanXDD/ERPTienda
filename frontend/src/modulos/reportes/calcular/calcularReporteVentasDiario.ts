import type { VentaRegistrada } from '../../../tipos/venta';
import { etiquetaEstadoFacturacion } from '../../../datos/condicionesIva';
import { etiquetaFormaPago } from '../../../datos/formasPago';
import {
  formatearFechaDiaMesAnio,
  formatearHoraAmPm,
} from '../../../utilidades/formatoFechaHora';
import {
  cumpleFiltroCliente,
  cumpleFiltroEstadoFacturacion,
  type OpcionEntidadReporte,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas, formatearRangoFechasLegible } from '../filtroFechasReporte';
import { formatearMonedaReporte } from '../formatoMonedaReporte';
import {
  calcularReporteVentasPeriodo,
  type DatosReporteVentasPeriodo,
  type FilaFormaPagoReporte,
  type FiltrosReporteVentasPeriodo,
} from './calcularReporteVentasPeriodo';

export interface FilaVentaDiariaReporte {
  numero: string;
  hora: string;
  cliente: string;
  formaPago: string;
  estadoFacturacion: string;
  facturacion: string;
  total: string;
}

export interface DatosReporteVentasDiario
  extends Omit<DatosReporteVentasPeriodo, 'tituloReporte' | 'filasVentas'> {
  tituloReporte: string;
  filasVentas: FilaVentaDiariaReporte[];
  filasFormaPago: FilaFormaPagoReporte[];
}

function diaReporteLegible(filtro: FiltrosReporteVentasPeriodo): string {
  if (filtro.fechaDesde === filtro.fechaHasta) {
    return formatearFechaDiaMesAnio(`${filtro.fechaDesde}T12:00:00`);
  }
  return formatearRangoFechasLegible(filtro);
}

export function calcularReporteVentasDiario(
  ventas: VentaRegistrada[],
  filtro: FiltrosReporteVentasPeriodo,
  opcionesCliente: OpcionEntidadReporte[],
): DatosReporteVentasDiario {
  const base = calcularReporteVentasPeriodo(ventas, filtro, opcionesCliente);

  const ventasDelDia = ventas
    .filter(
      (v) =>
        estaEnRangoFechas(v.fecha, filtro) &&
        cumpleFiltroCliente(filtro.idCliente, v.clienteId) &&
        cumpleFiltroEstadoFacturacion(filtro.idEstadoFacturacion, v.estadoFacturacion),
    )
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const filasVentas: FilaVentaDiariaReporte[] = ventasDelDia.map((v) => ({
    numero: v.numero,
    hora: formatearHoraAmPm(v.fecha),
    cliente: v.nombreClienteMostrar,
    formaPago: etiquetaFormaPago(v.formaPago),
    estadoFacturacion: etiquetaEstadoFacturacion(v.estadoFacturacion),
    facturacion: v.facturacion?.trim() || '—',
    total: formatearMonedaReporte(v.total),
  }));

  return {
    ...base,
    tituloReporte: 'Ventas del día',
    rangoLegible: diaReporteLegible(filtro),
    filasVentas,
  };
}
