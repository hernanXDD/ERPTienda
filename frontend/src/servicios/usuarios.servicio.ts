import type { RespuestaApi } from '../tipos/api';
import type { RolUsuario } from '../tipos/sesion';
import type { PermisosOperativosUsuario, UsuarioGestion } from '../tipos/usuarioGestion';
import { clienteHttp } from './http';

export async function listarUsuariosApi(): Promise<UsuarioGestion[]> {
  const { data } = await clienteHttp.get<RespuestaApi<UsuarioGestion[]>>('/usuarios');
  return data.datos;
}

export async function crearUsuarioApi(datos: {
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  contrasenaPlano: string;
  rol: RolUsuario;
  habilitado: boolean;
}): Promise<UsuarioGestion> {
  const { data } = await clienteHttp.post<RespuestaApi<UsuarioGestion>>('/usuarios', datos);
  return data.datos;
}

export async function actualizarUsuarioApi(
  id: string,
  datos: {
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    contrasenaPlano?: string | null;
    rol: RolUsuario;
    habilitado: boolean;
  },
): Promise<UsuarioGestion> {
  const { data } = await clienteHttp.patch<RespuestaApi<UsuarioGestion>>(`/usuarios/${id}`, datos);
  return data.datos;
}

export async function actualizarPermisosUsuarioApi(
  id: string,
  permisos: PermisosOperativosUsuario,
): Promise<UsuarioGestion> {
  const { data } = await clienteHttp.patch<RespuestaApi<UsuarioGestion>>(
    `/usuarios/${id}/permisos`,
    permisos,
  );
  return data.datos;
}

export async function establecerHabilitacionUsuarioApi(
  id: string,
  habilitado: boolean,
): Promise<UsuarioGestion> {
  const { data } = await clienteHttp.patch<RespuestaApi<UsuarioGestion>>(
    `/usuarios/${id}/habilitado`,
    { habilitado },
  );
  return data.datos;
}

export async function blanquearContraseniaUsuarioApi(id: string): Promise<UsuarioGestion> {
  const { data } = await clienteHttp.post<RespuestaApi<UsuarioGestion>>(
    `/usuarios/${id}/blanquear-contrasena`,
  );
  return data.datos;
}

export async function eliminarUsuarioApi(id: string): Promise<void> {
  await clienteHttp.delete(`/usuarios/${id}`);
}
