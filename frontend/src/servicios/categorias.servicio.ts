import type { RespuestaApi } from '../tipos/api';
import type { Categoria } from '../tipos/catalogo';
import { clienteHttp } from './http';

export async function listarCategoriasApi(): Promise<Categoria[]> {
  const { data } = await clienteHttp.get<RespuestaApi<Categoria[]>>('/categorias');
  return data.datos;
}

export async function crearCategoriaApi(datos: Omit<Categoria, 'id'>): Promise<Categoria> {
  const { data } = await clienteHttp.post<RespuestaApi<Categoria>>('/categorias', datos);
  return data.datos;
}

export async function actualizarCategoriaApi(
  id: string,
  datos: Omit<Categoria, 'id'>,
): Promise<Categoria> {
  const { data } = await clienteHttp.patch<RespuestaApi<Categoria>>(`/categorias/${id}`, datos);
  return data.datos;
}

export async function eliminarCategoriaApi(id: string): Promise<void> {
  await clienteHttp.delete(`/categorias/${id}`);
}
