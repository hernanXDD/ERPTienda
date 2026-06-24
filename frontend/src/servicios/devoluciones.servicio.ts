import type { RespuestaApi } from '../tipos/api';
import type {
  DatosRegistrarDevolucion,
  DevolucionRegistrada,
} from '../tipos/devolucion';
import { clienteHttp } from './http';

export interface DevolucionRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  ventaId: string;
  numeroVenta: string;
  nombreClienteMostrar?: string;
  total: number;
  observaciones: string;
  lineas: DevolucionRegistrada['lineas'];
}

export async function listarDevolucionesApi(): Promise<DevolucionRegistradaApi[]> {
  const { data } = await clienteHttp.get<RespuestaApi<DevolucionRegistradaApi[]>>('/devoluciones');
  return data.datos;
}

export async function registrarDevolucionApi(
  datos: DatosRegistrarDevolucion,
): Promise<DevolucionRegistradaApi> {
  const { data } = await clienteHttp.post<RespuestaApi<DevolucionRegistradaApi>>('/devoluciones', {
    ventaId: datos.ventaId,
    lineas: datos.lineas,
    observaciones: datos.observaciones?.trim() ?? '',
  });
  return data.datos;
}

export function mapearDevolucionApi(devolucion: DevolucionRegistradaApi): DevolucionRegistrada {
  return {
    ...devolucion,
    nombreClienteMostrar: devolucion.nombreClienteMostrar ?? '',
  };
}
