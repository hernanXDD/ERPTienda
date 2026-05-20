import type { RolUsuarioApi } from './rol-usuario-api';

/** Mismo contrato que `UsuarioSesion` en el frontend. */
export interface UsuarioSesion {
  id: string;
  nombreUsuario: string;
  rol: RolUsuarioApi;
}
