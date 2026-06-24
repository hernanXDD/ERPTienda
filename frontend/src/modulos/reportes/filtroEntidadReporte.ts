import type { Cliente } from '../../tipos/cliente';
import type { Proveedor } from '../../tipos/proveedor';
import type { EstadoFacturacionVenta } from '../../tipos/venta';
import type { FiltroFechasReporte } from './filtroFechasReporte';
import { rangoFechasPorDefecto, rangoFechasHoy } from './filtroFechasReporte';

/** Valor especial en el selector para ventas sin cliente registrado. */
export const ID_CONSUMIDOR_FINAL_REPORTE = '__consumidor_final__';

export interface OpcionEntidadReporte {
  id: string;
  etiqueta: string;
}

export interface FiltrosReporteConCliente extends FiltroFechasReporte {
  /** Vacío = todos los clientes. */
  idCliente: string;
}

export interface FiltrosReporteConProveedor extends FiltroFechasReporte {
  /** Vacío = todos los proveedores. */
  idProveedor: string;
}

/** Modelo unificado para la barra de filtros en pantalla. */
export interface FiltrosReporteVista extends FiltroFechasReporte {
  idCliente: string;
  idProveedor: string;
  /** Vacío = todos los estados de facturación. */
  idEstadoFacturacion: string;
}

export function filtrosReporteVentasDiarioPorDefecto(): FiltrosReporteVista {
  return {
    ...rangoFechasHoy(),
    idCliente: '',
    idProveedor: '',
    idEstadoFacturacion: '',
  };
}

export function filtrosReporteVistaPorDefecto(): FiltrosReporteVista {
  return {
    ...rangoFechasPorDefecto(),
    idCliente: '',
    idProveedor: '',
    idEstadoFacturacion: '',
  };
}

export function filtrosReporteConClientePorDefecto(): FiltrosReporteConCliente {
  return {
    ...rangoFechasPorDefecto(),
    idCliente: '',
  };
}

export function filtrosReporteConProveedorPorDefecto(): FiltrosReporteConProveedor {
  return {
    ...rangoFechasPorDefecto(),
    idProveedor: '',
  };
}

export function cumpleFiltroCliente(
  idClienteFiltro: string,
  clienteIdRegistro: string | null
): boolean {
  if (!idClienteFiltro.trim()) return true;
  if (idClienteFiltro === ID_CONSUMIDOR_FINAL_REPORTE) return clienteIdRegistro === null;
  return clienteIdRegistro === idClienteFiltro;
}

export function cumpleFiltroProveedor(idProveedorFiltro: string, proveedorId: string): boolean {
  if (!idProveedorFiltro.trim()) return true;
  return proveedorId === idProveedorFiltro;
}

export function cumpleFiltroEstadoFacturacion(
  idEstadoFiltro: string,
  estadoFacturacion: EstadoFacturacionVenta
): boolean {
  if (!idEstadoFiltro.trim()) return true;
  return estadoFacturacion.codigo === idEstadoFiltro;
}

export function opcionesEstadoFacturacionParaReporte(): OpcionEntidadReporte[] {
  return [
    { id: '', etiqueta: 'Todos los estados' },
    { id: 'PENDIENTE', etiqueta: 'Factura pendiente' },
    { id: 'FACTURADA', etiqueta: 'Facturada' },
  ];
}

/** Opciones del reporte «Ventas para facturación». */
export function opcionesFiltroFacturacionVentasFacturacion(): OpcionEntidadReporte[] {
  return [
    { id: '', etiqueta: 'Todas' },
    { id: 'PENDIENTE', etiqueta: 'No facturadas' },
    { id: 'FACTURADA', etiqueta: 'Facturadas' },
  ];
}

export function etiquetaFiltroEstadoFacturacionLegible(
  idEstadoFacturacion: string,
  opciones: OpcionEntidadReporte[] = opcionesEstadoFacturacionParaReporte(),
): string {
  if (!idEstadoFacturacion.trim()) return '';
  return opciones.find((o) => o.id === idEstadoFacturacion)?.etiqueta ?? 'Estado seleccionado';
}

export function opcionesClientesParaReporte(clientes: Cliente[]): OpcionEntidadReporte[] {
  const ordenados = [...clientes]
    .filter((c) => c.habilitado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return [
    { id: '', etiqueta: 'Todos los clientes' },
    { id: ID_CONSUMIDOR_FINAL_REPORTE, etiqueta: 'Consumidor final' },
    ...ordenados.map((c) => ({ id: c.id, etiqueta: c.nombre })),
  ];
}

export function opcionesProveedoresParaReporte(proveedores: Proveedor[]): OpcionEntidadReporte[] {
  const ordenados = [...proveedores]
    .filter((p) => p.habilitado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return [
    { id: '', etiqueta: 'Todos los proveedores' },
    ...ordenados.map((p) => ({ id: p.id, etiqueta: p.nombre })),
  ];
}

export function etiquetaFiltroClienteLegible(
  idCliente: string,
  opciones: OpcionEntidadReporte[]
): string {
  if (!idCliente.trim()) return 'Todos los clientes';
  return opciones.find((o) => o.id === idCliente)?.etiqueta ?? 'Cliente seleccionado';
}

export function etiquetaFiltroProveedorLegible(
  idProveedor: string,
  opciones: OpcionEntidadReporte[]
): string {
  if (!idProveedor.trim()) return 'Todos los proveedores';
  return opciones.find((o) => o.id === idProveedor)?.etiqueta ?? 'Proveedor seleccionado';
}
