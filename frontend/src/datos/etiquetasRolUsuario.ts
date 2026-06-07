import type { RolUsuario } from '../tipos/sesion';

export function etiquetaRolUsuario(rol: RolUsuario): string {
  switch (rol) {
    case 'ADMIN':
      return 'Administrador';
    case 'DUEÑO':
      return 'Dueño';
    case 'EMPLEADO':
      return 'Empleado';
  }
}
