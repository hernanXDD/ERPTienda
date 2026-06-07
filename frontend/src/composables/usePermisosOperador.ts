import { computed } from 'vue';
import { useGestionUsuariosStore } from '../stores/gestionUsuarios';
import { useSesionStore } from '../stores/sesion';
import {
  permisosPorDefectoSegunRol,
  type ClavePermisoOperativo,
} from '../modulos/usuarios/permisosUsuario';
import type { PermisosOperativosUsuario } from '../tipos/usuarioGestion';

export function usePermisosOperador() {
  const sesionStore = useSesionStore();
  const gestionUsuariosStore = useGestionUsuariosStore();

  const permisos = computed((): PermisosOperativosUsuario | null => {
    const id = sesionStore.usuario?.id;
    const rol = sesionStore.usuario?.rol;
    if (!id || !rol) return null;

    const fila = gestionUsuariosStore.obtenerPorId(id);
    if (fila?.habilitado) return fila.permisos;

    return permisosPorDefectoSegunRol(rol);
  });

  function tienePermiso(clave: ClavePermisoOperativo): boolean {
    return permisos.value?.[clave] === true;
  }

  return { permisos, tienePermiso };
}
