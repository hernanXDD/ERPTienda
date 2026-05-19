import type { RolUsuario } from '../tipos/sesion';
import type {
  MenusVisiblesUsuario,
  PermisosOperativosUsuario,
  UsuarioGestion,
} from '../tipos/usuarioGestion';

function rolEsElevado(rol: RolUsuario): boolean {
  return rol === 'ADMIN' || rol === 'DUEÑO';
}

/** Menús habilitados por defecto (todo visible salvo que se cambie en Permisos usuario). */
export function menusVisiblesPorDefecto(): MenusVisiblesUsuario {
  return {
    clientes: true,
    ventas: true,
    compras: true,
    productos: true,
    stock: true,
    usuarios: true,
    configuracion: true,
  };
}

/** Completa claves faltantes (sesiones viejas o datos parciales). */
export function menusVisiblesResueltos(parcial?: Partial<MenusVisiblesUsuario>): MenusVisiblesUsuario {
  return { ...menusVisiblesPorDefecto(), ...parcial };
}

export function permisosPorDefectoSegunRol(rol: RolUsuario): PermisosOperativosUsuario {
  const esElevado = rolEsElevado(rol);
  return {
    puedeAjustarStock: esElevado,
    puedeRegistrarCompras: esElevado,
    puedeGestionarCatalogoProductos: esElevado,
    puedeGestionarFichasDeUsuario: esElevado,
    puedeInhabilitarUsuario: esElevado,
    puedeEliminarUsuario: esElevado,
    puedeBlanquearContrasenaUsuario: esElevado,
    menusVisibles: menusVisiblesPorDefecto(),
  };
}

/** Misma información base que antes estaba sólo en el simulador de login (admin / dueño + empleado demo). */
export function crearSemillaUsuariosGestion(): UsuarioGestion[] {
  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Ana',
      apellido: 'Administración',
      nombreUsuario: 'admin',
      contrasenaPlano: 'admin',
      contrasenaEstaBlanqueada: false,
      rol: 'ADMIN',
      habilitado: true,
      permisos: permisosPorDefectoSegunRol('ADMIN'),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Roberto',
      apellido: 'Gestión Local',
      nombreUsuario: 'dueño',
      contrasenaPlano: 'dueño',
      contrasenaEstaBlanqueada: false,
      rol: 'DUEÑO',
      habilitado: true,
      permisos: permisosPorDefectoSegunRol('DUEÑO'),
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Laura',
      apellido: 'Mostrador',
      nombreUsuario: 'empleado',
      contrasenaPlano: 'empleado',
      contrasenaEstaBlanqueada: false,
      rol: 'EMPLEADO',
      habilitado: true,
      permisos: permisosPorDefectoSegunRol('EMPLEADO'),
    },
  ];
}
