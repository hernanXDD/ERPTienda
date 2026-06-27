import type { RespuestaApi } from '../tipos/api';
import type {
  DatosActualizarFormaPago,
  DatosCrearFormaPago,
  FormaPago,
} from '../tipos/formaPago';
import { clienteHttp } from './http';

export async function listarFormasPagoApi(): Promise<FormaPago[]> {
  const { data } = await clienteHttp.get<RespuestaApi<FormaPago[]>>('/formas-pago');
  return data.datos;
}

export async function crearFormaPagoApi(datos: DatosCrearFormaPago): Promise<FormaPago> {
  const { data } = await clienteHttp.post<RespuestaApi<FormaPago>>('/formas-pago', datos);
  return data.datos;
}

export async function actualizarFormaPagoApi(
  id: string,
  datos: DatosActualizarFormaPago,
): Promise<FormaPago> {
  const { data } = await clienteHttp.patch<RespuestaApi<FormaPago>>(`/formas-pago/${id}`, datos);
  return data.datos;
}

export async function eliminarFormaPagoApi(id: string): Promise<void> {
  await clienteHttp.delete(`/formas-pago/${id}`);
}
