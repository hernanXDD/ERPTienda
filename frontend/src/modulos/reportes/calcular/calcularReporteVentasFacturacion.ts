import type { Cliente } from '../../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../../tipos/cuentaCorriente';
import type { FormaPago } from '../../../tipos/formaPago';
import type { VentaRegistrada } from '../../../tipos/venta';
import { esFormaPagoCuentaCorriente, etiquetaFormaPago } from '../../../datos/formasPago';
import {
  etiquetaCondicionIva,
  etiquetaEstadoFacturacion,
  MONEDA_OPERATIVA,
} from '../../../datos/condicionesIva';
import { CONDICION_IVA_POR_DEFECTO } from '../../../tipos/condicionIva';
import { formatearFechaYHora } from '../../../utilidades/formatoFechaHora';
import {
  cumpleFiltroCliente,
  cumpleFiltroEstadoFacturacion,
  etiquetaFiltroClienteLegible,
  etiquetaFiltroEstadoFacturacionLegible,
  opcionesFiltroFacturacionVentasFacturacion,
  type FiltrosReporteVista,
  type OpcionEntidadReporte,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas } from '../filtroFechasReporte';
import { metadatosComunesReporte } from '../metadatosReporte';
import { calcularVentasCcCobradasParaFacturacion } from './ventasCcCobradasFacturacion';

export const COLUMNAS_REPORTE_VENTAS_FACTURACION = {
  fechaHora: 'Fecha y hora',
  numeroVenta: 'N° de venta',
  cliente: 'Cliente',
  documento: 'CUIT/CUIL/DNI',
  condicionIva: 'Condición IVA',
  importeNeto: 'Importe neto',
  moneda: 'Moneda',
  formaPago: 'Forma de pago',
  estadoFacturacion: 'Estado de facturación',
  numeroFactura: 'N° de factura',
} as const;

export type ColumnaReporteVentasFacturacion =
  (typeof COLUMNAS_REPORTE_VENTAS_FACTURACION)[keyof typeof COLUMNAS_REPORTE_VENTAS_FACTURACION];

export interface FilaReporteVentasFacturacion {
  fechaHora: string;
  numeroVenta: string;
  cliente: string;
  documento: string;
  condicionIva: string;
  importeNeto: number;
  moneda: string;
  formaPago: string;
  estadoFacturacion: string;
  facturacion: string;
}

export interface DatosReporteVentasFacturacion {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  filtroEntidadLegible: string;
  filtroEstadoFacturacionLegible: string;
  generadoEl: string;
  filas: FilaReporteVentasFacturacion[];
  totalImporte: number;
  cantidadOperaciones: number;
  sinVentas: boolean;
}

function extraerDocumentoDesdeNombreMostrar(nombreClienteMostrar: string): string {
  const separador = nombreClienteMostrar.indexOf(' — ');
  if (separador < 0) return '';
  return nombreClienteMostrar.slice(separador + 3).trim();
}

function resolverDocumentoVenta(venta: VentaRegistrada, cliente?: Cliente): string {
  const snapshot = venta.documentoClienteMostrar?.trim();
  if (snapshot) return snapshot;
  const documentoCliente = cliente?.documento?.trim();
  if (documentoCliente) return documentoCliente;
  return extraerDocumentoDesdeNombreMostrar(venta.nombreClienteMostrar);
}

function resolverCondicionIvaVenta(venta: VentaRegistrada, cliente?: Cliente): string {
  const condicion = venta.condicionIvaCliente ?? cliente?.condicionIva ?? CONDICION_IVA_POR_DEFECTO;
  return etiquetaCondicionIva(condicion);
}

function mapearFilaVentaFacturacion(
  venta: VentaRegistrada,
  clientesPorId: Map<string, Cliente>,
  fechaMostrar: string,
  formaPagoEtiqueta: string,
): FilaReporteVentasFacturacion {
  const cliente = venta.clienteId ? clientesPorId.get(venta.clienteId) : undefined;
  const documento = resolverDocumentoVenta(venta, cliente);
  const facturacion = venta.facturacion?.trim() ?? '';

  return {
    fechaHora: formatearFechaYHora(fechaMostrar),
    numeroVenta: venta.numero,
    cliente: venta.nombreClienteMostrar,
    documento,
    condicionIva: resolverCondicionIvaVenta(venta, cliente),
    importeNeto: venta.total,
    moneda: MONEDA_OPERATIVA,
    formaPago: formaPagoEtiqueta,
    estadoFacturacion: etiquetaEstadoFacturacion(venta.estadoFacturacion),
    facturacion,
  };
}

export function calcularReporteVentasFacturacion(
  ventas: VentaRegistrada[],
  clientes: Cliente[],
  filtro: FiltrosReporteVista,
  opcionesCliente: OpcionEntidadReporte[],
  incluirVentaEnFacturacion: (codigoFormaPago: string) => boolean = () => true,
  movimientosCc: MovimientoCuentaCorriente[] = [],
  formasPago: FormaPago[] = [],
): DatosReporteVentasFacturacion {
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));
  const filtroClienteLegible = etiquetaFiltroClienteLegible(filtro.idCliente, opcionesCliente);
  const filtroEstadoLegible = etiquetaFiltroEstadoFacturacionLegible(
    filtro.idEstadoFacturacion,
    opcionesFiltroFacturacionVentasFacturacion(),
  );
  const meta = metadatosComunesReporte(filtro, filtroClienteLegible);

  const enPeriodo = ventas
    .filter(
      (v) =>
        !esFormaPagoCuentaCorriente(v.formaPago) &&
        estaEnRangoFechas(v.fecha, filtro) &&
        cumpleFiltroCliente(filtro.idCliente, v.clienteId) &&
        cumpleFiltroEstadoFacturacion(filtro.idEstadoFacturacion, v.estadoFacturacion) &&
        incluirVentaEnFacturacion(v.formaPago),
    )
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const ventasCcCobradas = calcularVentasCcCobradasParaFacturacion(
    ventas,
    movimientosCc,
    filtro,
    formasPago,
    incluirVentaEnFacturacion,
  );

  const filasPendientes = [
    ...enPeriodo.map((venta) => ({
      venta,
      fechaOrden: venta.fecha,
      formaPagoEtiqueta: etiquetaFormaPago(venta.formaPago, formasPago),
    })),
    ...ventasCcCobradas.map(({ venta, fechaCobro, formaPagoCobroEtiqueta }) => ({
      venta,
      fechaOrden: fechaCobro,
      formaPagoEtiqueta: formaPagoCobroEtiqueta,
    })),
  ].sort((a, b) => new Date(b.fechaOrden).getTime() - new Date(a.fechaOrden).getTime());

  const filas = filasPendientes.map(({ venta, fechaOrden, formaPagoEtiqueta }) =>
    mapearFilaVentaFacturacion(venta, clientesPorId, fechaOrden, formaPagoEtiqueta),
  );

  const totalImporte = filas.reduce((acc, fila) => acc + fila.importeNeto, 0);

  return {
    tituloReporte: 'Ventas para facturación',
    negocioNombre: meta.negocioNombre,
    rangoLegible: meta.rangoLegible,
    filtroEntidadLegible: filtroClienteLegible,
    filtroEstadoFacturacionLegible: filtroEstadoLegible,
    generadoEl: meta.generadoEl,
    filas,
    totalImporte,
    cantidadOperaciones: filas.length,
    sinVentas: filas.length === 0,
  };
}

export function nombreArchivoExcelVentasFacturacion(
  fechaDesde: string,
  fechaHasta: string,
): string {
  return `ventas-facturacion_${fechaDesde}_${fechaHasta}.xlsx`;
}
