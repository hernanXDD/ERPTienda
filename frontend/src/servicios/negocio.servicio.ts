import type { RespuestaApi } from '../tipos/api';
import type { DatosNegocioEditable, Negocio } from '../tipos/negocio';
import { clienteHttp } from './http';

export async function obtenerNegocioApi(): Promise<Negocio> {
  const { data } = await clienteHttp.get<RespuestaApi<Negocio>>('/configuracion/negocio');
  return data.datos;
}

export async function actualizarNegocioApi(datos: DatosNegocioEditable): Promise<Negocio> {
  const { data } = await clienteHttp.patch<RespuestaApi<Negocio>>('/configuracion/negocio', datos);
  return data.datos;
}
