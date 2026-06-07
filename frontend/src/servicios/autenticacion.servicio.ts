import type { RespuestaInicioSesion, RespuestaSesionActual } from '../tipos/api';
import type { CredencialesInicioSesion } from '../tipos/sesion';
import { clienteHttp } from './http';

export async function iniciarSesion(credenciales: CredencialesInicioSesion) {
  const { data } = await clienteHttp.post<RespuestaInicioSesion>(
    '/autenticacion/inicio-sesion',
    credenciales
  );
  return data;
}

export async function obtenerSesionActual() {
  const { data } = await clienteHttp.get<RespuestaSesionActual>('/autenticacion/sesion-actual');
  return data;
}

export async function cerrarSesionEnServidor() {
  await clienteHttp.post('/autenticacion/cierre-sesion', {});
}
