import type { RespuestaApi } from '../tipos/api';
import type { CompraRegistrada, IdCondicionCompra, LineaCompraRegistro } from '../tipos/compraRegistrada';
import { clienteHttp } from './http';

export interface DatosRegistrarCompraApi {
  proveedorId: string;
  nombreProveedorMostrar: string;
  condicionCompra: IdCondicionCompra;
  total: number;
  lineas: LineaCompraRegistro[];
  observaciones: string;
}

export async function listarComprasApi(): Promise<CompraRegistrada[]> {
  const { data } = await clienteHttp.get<RespuestaApi<CompraRegistrada[]>>('/compras');
  return data.datos.map(mapearCompraApi);
}

export async function registrarCompraApi(
  datos: DatosRegistrarCompraApi,
): Promise<CompraRegistrada> {
  const { data } = await clienteHttp.post<RespuestaApi<CompraRegistradaApi>>('/compras', {
    proveedorId: datos.proveedorId,
    nombreProveedorMostrar: datos.nombreProveedorMostrar,
    condicionCompra: datos.condicionCompra,
    total: datos.total,
    lineas: datos.lineas,
    observaciones: datos.observaciones.trim(),
  });
  return mapearCompraApi(data.datos);
}

interface CompraRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  proveedorId: string;
  nombreProveedorMostrar: string;
  condicionCompra: string;
  total: number;
  lineas: LineaCompraRegistro[];
  observaciones: string;
}

function mapearCompraApi(compra: CompraRegistradaApi): CompraRegistrada {
  return {
    id: compra.id,
    numero: compra.numero,
    fecha: compra.fecha,
    proveedorId: compra.proveedorId,
    nombreProveedorMostrar: compra.nombreProveedorMostrar,
    condicionCompra: compra.condicionCompra as IdCondicionCompra,
    total: compra.total,
    lineas: compra.lineas,
    observaciones: compra.observaciones,
    registradoPor: { idUsuario: null, etiquetaUsuario: '—' },
  };
}
