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
  /** Entradas manuales fuera de compras o conteos físicos. */
  puedeMoverStockManualmente: boolean;
  puedeRegistrarCompras: boolean;
  puedeGestionarCatalogoProductos: boolean;
  puedeGestionarClientes: boolean;
  puedeGestionarCuentaCorriente: boolean;
  puedeGestionarCuentaCorrienteProveedor: boolean;
  puedeRegistrarVentas: boolean;
  puedeCargarFacturaciones: boolean;
  puedeGestionarProveedores: boolean;
  puedeEditarConfiguracionNegocio: boolean;
  puedeEditarConfiguracionSistema: boolean;
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
    puedeMoverStockManualmente: esElevado,
    puedeRegistrarCompras: esElevado,
    puedeGestionarCatalogoProductos: esElevado,
    puedeGestionarClientes: esElevado,
    puedeGestionarCuentaCorriente: esElevado,
    puedeGestionarCuentaCorrienteProveedor: esElevado,
    puedeRegistrarVentas: esElevado,
    puedeCargarFacturaciones: esElevado,
    puedeGestionarProveedores: esElevado,
    puedeEditarConfiguracionNegocio: esElevado,
    puedeEditarConfiguracionSistema: esElevado,
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

/** Fusiona permisos guardados con defaults de rol y compatibilidad con cuentas antiguas. */
export function permisosOperativosResueltos(
  rol: RolUsuario,
  almacenados: Partial<PermisosOperativosUsuario> = {},
): PermisosOperativosUsuario {
  const base = permisosPorDefectoSegunRol(rol);
  const puedeMoverStockManualmente =
    almacenados.puedeMoverStockManualmente ??
    (almacenados.puedeAjustarStock === true ? true : base.puedeMoverStockManualmente);

  return {
    ...base,
    ...almacenados,
    puedeMoverStockManualmente,
    menusVisibles: menusVisiblesResueltos(almacenados.menusVisibles),
  };
}
