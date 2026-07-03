/** Cuenta administradora principal con acceso a operaciones de implementación (carga inicial). */
export const ID_USUARIO_CONFIGURACION_APP = '000001';

export const NOMBRE_USUARIO_CONFIGURACION_APP = 'admin';

export function esUsuarioConfiguracionApp(operador: {
  id: string;
  nombreUsuario: string;
}): boolean {
  return (
    operador.id === ID_USUARIO_CONFIGURACION_APP ||
    operador.nombreUsuario === NOMBRE_USUARIO_CONFIGURACION_APP
  );
}
