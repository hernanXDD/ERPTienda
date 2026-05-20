import type { RegistroOperador } from '../tipos/registroOperador';

export const ID_USUARIO_ADMIN = '11111111-1111-1111-1111-111111111111';
export const ID_USUARIO_DUENO = '22222222-2222-2222-2222-222222222222';
export const ID_USUARIO_EMPLEADO = '33333333-3333-3333-3333-333333333333';

export function registroOperadorSemilla(idUsuario: string, etiquetaUsuario: string): RegistroOperador {
  return { idUsuario, etiquetaUsuario };
}

export const REGISTRO_ADMIN = registroOperadorSemilla(ID_USUARIO_ADMIN, 'admin');
export const REGISTRO_DUENO = registroOperadorSemilla(ID_USUARIO_DUENO, 'dueño');
export const REGISTRO_EMPLEADO = registroOperadorSemilla(ID_USUARIO_EMPLEADO, 'empleado');
