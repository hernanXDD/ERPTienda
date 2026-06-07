import type { RespuestaApi } from '../tipos/api';
import type { Cliente } from '../tipos/cliente';
import { clienteHttp } from './http';

export async function listarClientesApi(): Promise<Cliente[]> {
  const { data } = await clienteHttp.get<RespuestaApi<Cliente[]>>('/clientes');
  return data.datos;
}

export async function crearClienteApi(datos: Omit<Cliente, 'id'>): Promise<Cliente> {
  const { data } = await clienteHttp.post<RespuestaApi<Cliente>>('/clientes', datos);
  return data.datos;
}

export async function actualizarClienteApi(
  id: string,
  datos: Omit<Cliente, 'id'>,
): Promise<Cliente> {
  const { data } = await clienteHttp.patch<RespuestaApi<Cliente>>(`/clientes/${id}`, datos);
  return data.datos;
}

export async function establecerHabilitacionClienteApi(
  id: string,
  habilitado: boolean,
): Promise<Cliente> {
  const { data } = await clienteHttp.patch<RespuestaApi<Cliente>>(`/clientes/${id}/habilitado`, {
    habilitado,
  });
  return data.datos;
}

export async function eliminarClienteApi(id: string): Promise<void> {
  await clienteHttp.delete(`/clientes/${id}`);
}
