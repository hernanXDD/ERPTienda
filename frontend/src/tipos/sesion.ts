import type { PermisosOperativosUsuario } from './usuarioGestion';

export type RolUsuario = 'ADMIN' | 'DUEÑO' | 'EMPLEADO';

export interface UsuarioSesion {
  id: string;
  nombreUsuario: string;
  rol: RolUsuario;
  permisos: PermisosOperativosUsuario;
}

export interface CredencialesInicioSesion {
  nombreUsuario: string;
  contrasena: string;
}
