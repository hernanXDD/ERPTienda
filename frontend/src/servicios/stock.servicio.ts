import type { RespuestaApi } from '../tipos/api';
import type {
  AuditoriaStockDetalle,
  AuditoriaStockResumen,
  FiltrosAuditoriasStock,
  MovimientoStock,
} from '../tipos/stock';
import { clienteHttp } from './http';

export interface ResumenStockVarianteApi {
  varianteId: string;
  productoId: string;
  nombreProducto: string;
  marca: string;
  nombreCategoria: string;
  talle: string;
  color: string;
  codigoBarras: string;
  activa: boolean;
  cantidadActual: number;
  nombreLineaComercial: string;
}

export async function listarMovimientosStockApi(filtros?: {
  varianteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<MovimientoStock[]> {
  const { data } = await clienteHttp.get<RespuestaApi<MovimientoStock[]>>('/stock/movimientos', {
    params: filtros,
  });
  return data.datos;
}

export async function listarAuditoriasStockApi(
  filtros?: FiltrosAuditoriasStock,
): Promise<AuditoriaStockResumen[]> {
  const { data } = await clienteHttp.get<RespuestaApi<AuditoriaStockResumen[]>>(
    '/stock/auditorias',
    { params: filtros },
  );
  return data.datos;
}

export async function obtenerAuditoriaStockApi(id: string): Promise<AuditoriaStockDetalle> {
  const { data } = await clienteHttp.get<RespuestaApi<AuditoriaStockDetalle>>(
    `/stock/auditorias/${id}`,
  );
  return data.datos;
}

export async function obtenerResumenStockApi(): Promise<ResumenStockVarianteApi[]> {
  const { data } = await clienteHttp.get<RespuestaApi<ResumenStockVarianteApi[]>>('/stock/resumen');
  return data.datos;
}

export async function ajusteConteoStockApi(datos: {
  varianteId: string;
  cantidadFisicaContada: number;
  observacion?: string;
}): Promise<{ anterior: number; nuevo: number; delta: number }> {
  const { data } = await clienteHttp.post<
    RespuestaApi<{ anterior: number; nuevo: number; delta: number }>
  >('/stock/ajuste-conteo', datos);
  return data.datos;
}

export async function importarConteoMasivoStockApi(datos: {
  lineas: { varianteId: string; cantidadFisicaContada: number }[];
  observacion?: string;
}): Promise<{
  lineasProcesadas: number;
  lineasSinCambio: number;
  detalle: {
    varianteId: string;
    nombreVariante: string;
    anterior: number;
    nuevo: number;
    delta: number;
  }[];
}> {
  const { data } = await clienteHttp.post<
    RespuestaApi<{
      lineasProcesadas: number;
      lineasSinCambio: number;
      detalle: {
        varianteId: string;
        nombreVariante: string;
        anterior: number;
        nuevo: number;
        delta: number;
      }[];
    }>
  >('/stock/importar-conteo', datos);
  return data.datos;
}

export async function entradaManualStockApi(datos: {
  varianteId: string;
  cantidad: number;
  nota?: string;
}): Promise<{ cantidadAnterior: number; cantidadNueva: number }> {
  const { data } = await clienteHttp.post<
    RespuestaApi<{ cantidadAnterior: number; cantidadNueva: number }>
  >('/stock/entrada-manual', datos);
  return data.datos;
}
