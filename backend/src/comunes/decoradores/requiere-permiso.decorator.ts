import { SetMetadata } from '@nestjs/common';
import type { ClaveMenuPrincipal } from '../tipos/permisos-usuario';
import type { ClavePermisoOperativo } from '../permisos/permisos-usuario.service';

export const CLAVE_PERMISO_REQUERIDO = 'clave_permiso_requerido';
export const CLAVE_MENU_REQUERIDO = 'clave_menu_requerido';
export const REQUIERE_ROL_ELEVADO = 'requiere_rol_elevado';

export const RequierePermiso = (clave: ClavePermisoOperativo) =>
  SetMetadata(CLAVE_PERMISO_REQUERIDO, clave);

export const RequiereMenu = (menu: ClaveMenuPrincipal) =>
  SetMetadata(CLAVE_MENU_REQUERIDO, menu);

export const RequiereRolElevado = () => SetMetadata(REQUIERE_ROL_ELEVADO, true);
