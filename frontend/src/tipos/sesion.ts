export type RolUsuario = 'ADMIN' | 'DUEÑO' | 'EMPLEADO';

export interface UsuarioSesion {
  id: string;
  nombreUsuario: string;
  rol: RolUsuario;
}

export interface CredencialesInicioSesion {
  nombreUsuario: string;
  contrasena: string;
}
