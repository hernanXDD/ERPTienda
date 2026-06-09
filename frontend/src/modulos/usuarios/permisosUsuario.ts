import type { RolUsuario } from '../../tipos/sesion';
import type { MenusVisiblesUsuario, PermisosOperativosUsuario } from '../../tipos/usuarioGestion';

function rolEsElevado(rol: RolUsuario): boolean {
  return rol === 'ADMIN' || rol === 'DUEÑO';
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

export function menusVisiblesResueltos(parcial?: Partial<MenusVisiblesUsuario>): MenusVisiblesUsuario {
  return { ...menusVisiblesPorDefecto(), ...parcial };
}

export function permisosPorDefectoSegunRol(rol: RolUsuario): PermisosOperativosUsuario {
  const esElevado = rolEsElevado(rol);
  return {
    puedeAjustarStock: esElevado,
    puedeRegistrarCompras: esElevado,
    puedeGestionarCatalogoProductos: esElevado,
    puedeGestionarClientes: esElevado,
    puedeGestionarCuentaCorriente: esElevado,
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

export type ClavePermisoOperativo = Exclude<keyof PermisosOperativosUsuario, 'menusVisibles'>;

export function permisosResueltos(
  rol: RolUsuario,
  parcial?: Partial<PermisosOperativosUsuario>,
): PermisosOperativosUsuario {
  const base = permisosPorDefectoSegunRol(rol);
  if (!parcial) return base;
  return {
    ...base,
    ...parcial,
    menusVisibles: menusVisiblesResueltos(parcial.menusVisibles),
  };
}
