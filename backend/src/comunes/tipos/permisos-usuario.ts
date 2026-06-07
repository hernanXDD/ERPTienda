import { RolUsuario } from '@prisma/client';

export type ClaveMenuPrincipal =
  | 'clientes'
  | 'ventas'
  | 'compras'
  | 'productos'
  | 'stock'
  | 'reportes'
  | 'usuarios'
  | 'configuracion';

export type MenusVisiblesUsuario = Record<ClaveMenuPrincipal, boolean>;

export interface PermisosOperativosUsuario {
  puedeAjustarStock: boolean;
  puedeRegistrarCompras: boolean;
  puedeGestionarCatalogoProductos: boolean;
  puedeGestionarFichasDeUsuario: boolean;
  puedeInhabilitarUsuario: boolean;
  puedeEliminarUsuario: boolean;
  puedeBlanquearContrasenaUsuario: boolean;
  menusVisibles: MenusVisiblesUsuario;
}

function rolEsElevado(rol: RolUsuario): boolean {
  return rol === RolUsuario.ADMIN || rol === RolUsuario.DUENO;
}

export function menusVisiblesPorDefecto(): MenusVisiblesUsuario {
  return {
    clientes: true,
    ventas: true,
    compras: true,
    productos: true,
    stock: true,
    reportes: true,
    usuarios: true,
    configuracion: true,
  };
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

export function menusVisiblesResueltos(
  parcial?: Partial<MenusVisiblesUsuario>,
): MenusVisiblesUsuario {
  return { ...menusVisiblesPorDefecto(), ...parcial };
}
