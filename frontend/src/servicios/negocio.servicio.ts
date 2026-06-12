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

export async function obtenerLogoNegocioApi(): Promise<Blob> {
  const { data } = await clienteHttp.get<Blob>('/configuracion/negocio/logo', {
    responseType: 'blob',
  });
  return data;
}

export async function subirLogoNegocioApi(archivo: File): Promise<Negocio> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  const { data } = await clienteHttp.post<RespuestaApi<Negocio>>(
    '/configuracion/negocio/logo',
    formulario,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.datos;
}

export async function eliminarLogoNegocioApi(): Promise<Negocio> {
  const { data } = await clienteHttp.delete<RespuestaApi<Negocio>>('/configuracion/negocio/logo');
  return data.datos;
}
