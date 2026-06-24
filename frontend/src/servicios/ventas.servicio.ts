import type { RespuestaApi } from '../tipos/api';
import type {
  IdFormaPago,
  ItemCargarFacturacion,
  LineaVentaRegistro,
  EstadoFacturacionVenta,
} from '../tipos/venta';
import { clienteHttp } from './http';

export interface VentaRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar: string;
  condicionIvaCliente: string;
  formaPago: string;
  subtotal?: number;
  ajusteMonto?: number;
  ajustePorcentaje?: number | null;
  total: number;
  facturacion: string;
  estadoFacturacion: EstadoFacturacionVenta;
  lineas: LineaVentaRegistro[];
  observaciones: string;
}

export interface DatosRegistrarVentaApi {
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar?: string;
  formaPago: IdFormaPago;
  total: number;
  ajusteMonto?: number;
  ajustePorcentaje?: number | null;
  lineas: LineaVentaRegistro[];
  observaciones: string;
  cuponDescuentoId?: string | null;
}

export async function listarVentasApi(): Promise<VentaRegistradaApi[]> {
  const { data } = await clienteHttp.get<RespuestaApi<VentaRegistradaApi[]>>('/ventas');
  return data.datos;
}

export async function registrarVentaApi(datos: DatosRegistrarVentaApi): Promise<VentaRegistradaApi> {
  const { data } = await clienteHttp.post<RespuestaApi<VentaRegistradaApi>>('/ventas', {
    clienteId: datos.clienteId,
    nombreClienteMostrar: datos.nombreClienteMostrar,
    documentoClienteMostrar: datos.documentoClienteMostrar?.trim() || undefined,
    formaPago: datos.formaPago,
    total: datos.total,
    ajusteMonto: datos.ajusteMonto ?? 0,
    ajustePorcentaje: datos.ajustePorcentaje ?? null,
    lineas: datos.lineas,
    observaciones: datos.observaciones.trim(),
    cuponDescuentoId: datos.cuponDescuentoId ?? null,
  });
  return data.datos;
}

export async function cargarFacturacionesApi(
  items: ItemCargarFacturacion[],
): Promise<VentaRegistradaApi[]> {
  const { data } = await clienteHttp.post<RespuestaApi<VentaRegistradaApi[]>>(
    '/ventas/cargar-facturaciones',
    { items },
  );
  return data.datos;
}
