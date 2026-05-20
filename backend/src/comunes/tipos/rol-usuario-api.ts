import { RolUsuario } from '@prisma/client';

/** Roles expuestos al frontend (incluye Ñ en DUEÑO). */
export type RolUsuarioApi = 'ADMIN' | 'DUEÑO' | 'EMPLEADO';

export function rolDesdeBaseDeDatos(rol: RolUsuario): RolUsuarioApi {
  if (rol === RolUsuario.DUENO) return 'DUEÑO';
  return rol;
}

export function rolHaciaBaseDeDatos(rol: RolUsuarioApi): RolUsuario {
  if (rol === 'DUEÑO') return RolUsuario.DUENO;
  return rol as RolUsuario;
}
