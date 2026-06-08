import { computed } from 'vue';
import { useGestionUsuariosStore } from '../stores/gestionUsuarios';
import { useSesionStore } from '../stores/sesion';
import {
  menusVisiblesPorDefecto,
  permisosPorDefectoSegunRol,
  type ClavePermisoOperativo,
} from '../modulos/usuarios/permisosUsuario';
import type { MenusVisiblesUsuario, PermisosOperativosUsuario } from '../tipos/usuarioGestion';

export function usePermisosOperador() {
  const sesionStore = useSesionStore();
  const gestionUsuariosStore = useGestionUsuariosStore();

  const permisos = computed((): PermisosOperativosUsuario | null => {
    if (sesionStore.usuario?.permisos) {
      return sesionStore.usuario.permisos;
    }

    const id = sesionStore.usuario?.id;
    const rol = sesionStore.usuario?.rol;
    if (!id || !rol) return null;

    const fila = gestionUsuariosStore.obtenerPorId(id);
    if (fila?.habilitado) return fila.permisos;

    return permisosPorDefectoSegunRol(rol);
  });

  const menusVisibles = computed((): MenusVisiblesUsuario => {
    return permisos.value?.menusVisibles ?? menusVisiblesPorDefecto();
  });

  function tienePermiso(clave: ClavePermisoOperativo): boolean {
    return permisos.value?.[clave] === true;
  }

  function tieneMenu(clave: keyof MenusVisiblesUsuario): boolean {
    return menusVisibles.value[clave] === true;
  }

  return { permisos, menusVisibles, tienePermiso, tieneMenu };
}
