import type { RolUsuarioApi } from './rol-usuario-api';
import type { PermisosOperativosUsuario } from './permisos-usuario';

/** Mismo contrato que `UsuarioSesion` en el frontend. */
export interface UsuarioSesion {
  id: string;
  nombreUsuario: string;
  rol: RolUsuarioApi;
  permisos: PermisosOperativosUsuario;
  debeCambiarContrasena: boolean;
  modoOscuroHabilitado: boolean;
}
