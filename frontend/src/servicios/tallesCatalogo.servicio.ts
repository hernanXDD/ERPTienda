import type { RespuestaApi } from '../tipos/api';
import type {
  DatosActualizarTalleCatalogo,
  DatosCrearTalleCatalogo,
  TalleCatalogo,
} from '../tipos/talleCatalogo';
import { clienteHttp } from './http';

export async function listarTallesCatalogoApi(): Promise<TalleCatalogo[]> {
  const { data } = await clienteHttp.get<RespuestaApi<TalleCatalogo[]>>('/talles-catalogo');
  return data.datos;
}

export async function crearTalleCatalogoApi(datos: DatosCrearTalleCatalogo): Promise<TalleCatalogo> {
  const { data } = await clienteHttp.post<RespuestaApi<TalleCatalogo>>('/talles-catalogo', datos);
  return data.datos;
}

export async function actualizarTalleCatalogoApi(
  id: string,
  datos: DatosActualizarTalleCatalogo,
): Promise<TalleCatalogo> {
  const { data } = await clienteHttp.patch<RespuestaApi<TalleCatalogo>>(
    `/talles-catalogo/${id}`,
    datos,
  );
  return data.datos;
}

export async function eliminarTalleCatalogoApi(id: string): Promise<void> {
  await clienteHttp.delete(`/talles-catalogo/${id}`);
}
