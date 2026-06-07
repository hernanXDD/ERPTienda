import type { RespuestaApi } from '../tipos/api';
import type { Producto, Variante } from '../tipos/catalogo';
import { clienteHttp } from './http';

export async function listarProductosApi(): Promise<Producto[]> {
  const { data } = await clienteHttp.get<RespuestaApi<Producto[]>>('/catalogo/productos');
  return data.datos;
}

export async function crearProductoApi(datos: Omit<Producto, 'id'>): Promise<Producto> {
  const { data } = await clienteHttp.post<RespuestaApi<Producto>>('/catalogo/productos', datos);
  return data.datos;
}

export async function actualizarProductoApi(
  id: string,
  datos: Omit<Producto, 'id'>,
): Promise<Producto> {
  const { data } = await clienteHttp.patch<RespuestaApi<Producto>>(
    `/catalogo/productos/${id}`,
    datos,
  );
  return data.datos;
}

export async function eliminarProductoApi(id: string): Promise<void> {
  await clienteHttp.delete(`/catalogo/productos/${id}`);
}

export async function listarVariantesApi(productoId?: string): Promise<Variante[]> {
  const params = productoId ? { productoId } : undefined;
  const { data } = await clienteHttp.get<RespuestaApi<Variante[]>>('/catalogo/variantes', {
    params,
  });
  return data.datos;
}

export async function crearVarianteApi(datos: Omit<Variante, 'id'>): Promise<Variante> {
  const { data } = await clienteHttp.post<RespuestaApi<Variante>>('/catalogo/variantes', datos);
  return data.datos;
}

export async function actualizarVarianteApi(
  id: string,
  datos: Omit<Variante, 'id'>,
): Promise<Variante> {
  const { data } = await clienteHttp.patch<RespuestaApi<Variante>>(
    `/catalogo/variantes/${id}`,
    datos,
  );
  return data.datos;
}

export async function eliminarVarianteApi(id: string): Promise<void> {
  await clienteHttp.delete(`/catalogo/variantes/${id}`);
}
