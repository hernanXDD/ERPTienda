import type { CompraRegistrada } from '../../../tipos/compraRegistrada';
import { etiquetaCondicionCompra } from '../../../datos/condicionesCompra';
import { formatearFechaDiaMesAnio } from '../../../utilidades/formatoFechaHora';
import {
  cumpleFiltroProveedor,
  etiquetaFiltroProveedorLegible,
  type FiltrosReporteConProveedor,
  type OpcionEntidadReporte,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas } from '../filtroFechasReporte';
import {
  formatearMonedaReporte,
  formatearNumeroReporte,
  formatearPorcentajeReporte,
} from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

export interface FilaProveedorCompras {
  proveedor: string;
  operaciones: string;
  total: string;
  porcentaje: string;
}

export interface FilaCompraDetalle {
  numero: string;
  fecha: string;
  proveedor: string;
  condicion: string;
  total: string;
}

export interface DatosReporteComprasProveedor {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  filtroEntidadLegible: string;
  generadoEl: string;
  totalCompras: string;
  cantidadOperaciones: string;
  proveedoresActivos: string;
  filasProveedor: FilaProveedorCompras[];
  filasCompras: FilaCompraDetalle[];
  sinCompras: boolean;
}

export function calcularReporteComprasProveedor(
  compras: CompraRegistrada[],
  filtro: FiltrosReporteConProveedor,
  opcionesProveedor: OpcionEntidadReporte[]
): DatosReporteComprasProveedor {
  const enPeriodo = compras
    .filter(
      (c) =>
        estaEnRangoFechas(c.fecha, filtro) && cumpleFiltroProveedor(filtro.idProveedor, c.proveedorId)
    )
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const total = enPeriodo.reduce((a, c) => a + c.total, 0);
  const porProveedor = new Map<string, { nombre: string; ops: number; importe: number }>();

  for (const c of enPeriodo) {
    const prev = porProveedor.get(c.proveedorId) ?? {
      nombre: c.nombreProveedorMostrar,
      ops: 0,
      importe: 0,
    };
    porProveedor.set(c.proveedorId, {
      nombre: c.nombreProveedorMostrar,
      ops: prev.ops + 1,
      importe: prev.importe + c.total,
    });
  }

  const filasProveedor: FilaProveedorCompras[] = [...porProveedor.values()]
    .sort((a, b) => b.importe - a.importe)
    .map((p) => ({
      proveedor: p.nombre,
      operaciones: formatearNumeroReporte(p.ops),
      total: formatearMonedaReporte(p.importe),
      porcentaje: formatearPorcentajeReporte(p.importe, total),
    }));

  const filasCompras: FilaCompraDetalle[] = enPeriodo.map((c) => ({
    numero: c.numero,
    fecha: formatearFechaDiaMesAnio(c.fecha),
    proveedor: c.nombreProveedorMostrar,
    condicion: etiquetaCondicionCompra(c.condicionCompra),
    total: formatearMonedaReporte(c.total),
  }));

  const filtroEntidadLegible = etiquetaFiltroProveedorLegible(filtro.idProveedor, opcionesProveedor);

  return {
    tituloReporte: 'Compras por proveedor',
    ...metadatosComunesReporte(filtro, filtroEntidadLegible),
    totalCompras: formatearMonedaReporte(total),
    cantidadOperaciones: formatearNumeroReporte(enPeriodo.length),
    proveedoresActivos: formatearNumeroReporte(porProveedor.size),
    filasProveedor,
    filasCompras,
    sinCompras: enPeriodo.length === 0,
  };
}
