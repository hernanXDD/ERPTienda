import type { PermisosOperativosUsuario } from './usuarioGestion';

export type RolUsuario = 'ADMIN' | 'DUEÑO' | 'EMPLEADO';

export interface UsuarioSesion {
  id: string;
  nombreUsuario: string;
  rol: RolUsuario;
  permisos: PermisosOperativosUsuario;
  debeCambiarContrasena: boolean;
}

export interface CredencialesInicioSesion {
  nombreUsuario: string;
  contrasena: string;
}

export interface CambioContrasenaInicial {
  contrasenaNueva: string;
  contrasenaNuevaRepetida: string;
}
