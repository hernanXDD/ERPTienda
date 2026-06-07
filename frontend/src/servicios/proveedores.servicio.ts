import type { RespuestaApi } from '../tipos/api';
import type { Proveedor } from '../tipos/proveedor';
import { clienteHttp } from './http';

export async function listarProveedoresApi(): Promise<Proveedor[]> {
  const { data } = await clienteHttp.get<RespuestaApi<Proveedor[]>>('/proveedores');
  return data.datos;
}

export async function crearProveedorApi(datos: Omit<Proveedor, 'id'>): Promise<Proveedor> {
  const { data } = await clienteHttp.post<RespuestaApi<Proveedor>>('/proveedores', datos);
  return data.datos;
}

export async function actualizarProveedorApi(
  id: string,
  datos: Omit<Proveedor, 'id'>,
): Promise<Proveedor> {
  const { data } = await clienteHttp.patch<RespuestaApi<Proveedor>>(`/proveedores/${id}`, datos);
  return data.datos;
}

export async function establecerHabilitacionProveedorApi(
  id: string,
  habilitado: boolean,
): Promise<Proveedor> {
  const { data } = await clienteHttp.patch<RespuestaApi<Proveedor>>(
    `/proveedores/${id}/habilitado`,
    { habilitado },
  );
  return data.datos;
}

export async function eliminarProveedorApi(id: string): Promise<void> {
  await clienteHttp.delete(`/proveedores/${id}`);
}
