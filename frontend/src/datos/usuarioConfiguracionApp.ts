import type { UsuarioSesion } from '../tipos/sesion';

/** Cuenta administradora principal (semilla) con acceso al menú «Configuración de app». */
export const ID_USUARIO_CONFIGURACION_APP = '000001';

export const NOMBRE_USUARIO_CONFIGURACION_APP = 'admin';

export function esUsuarioConfiguracionApp(
  usuario: Pick<UsuarioSesion, 'id' | 'nombreUsuario'> | null | undefined,
): boolean {
  if (!usuario) return false;
  return (
    usuario.id === ID_USUARIO_CONFIGURACION_APP ||
    usuario.nombreUsuario === NOMBRE_USUARIO_CONFIGURACION_APP
  );
}
