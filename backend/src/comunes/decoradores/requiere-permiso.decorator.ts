import { SetMetadata } from '@nestjs/common';
import type { ClaveMenuPrincipal } from '../tipos/permisos-usuario';
import type { ClavePermisoOperativo } from '../permisos/permisos-usuario.service';

export const CLAVE_PERMISO_REQUERIDO = 'clave_permiso_requerido';
export const CLAVE_MENU_REQUERIDO = 'clave_menu_requerido';
export const CLAVE_MENUS_ALTERNATIVOS = 'clave_menus_alternativos';
export const REQUIERE_ROL_ELEVADO = 'requiere_rol_elevado';
export const REQUIERE_CONFIGURACION_APP = 'requiere_configuracion_app';

export const RequierePermiso = (clave: ClavePermisoOperativo) =>
  SetMetadata(CLAVE_PERMISO_REQUERIDO, clave);

export const RequiereMenu = (menu: ClaveMenuPrincipal) =>
  SetMetadata(CLAVE_MENU_REQUERIDO, menu);

/** Acceso si el operador tiene visible al menos uno de los menús indicados. */
export const RequiereAlgunoMenu = (...menus: ClaveMenuPrincipal[]) =>
  SetMetadata(CLAVE_MENUS_ALTERNATIVOS, menus);

export const RequiereRolElevado = () => SetMetadata(REQUIERE_ROL_ELEVADO, true);

/** Solo el administrador principal del sistema (implementación / carga inicial). */
export const RequiereConfiguracionApp = () => SetMetadata(REQUIERE_CONFIGURACION_APP, true);
