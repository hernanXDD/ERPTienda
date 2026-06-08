import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { menusVisiblesResueltos } from '../modulos/usuarios/permisosUsuario';
import {
  elementoMenuCoincideRuta,
  elementosMenuPrincipal,
  type ElementoMenuPrincipal,
} from '../modulos/nucleo/elementosNavegacion';
import { elementoMenuVisibleParaPermisos } from '../modulos/nucleo/menuPrincipal';
import { useGestionUsuariosStore } from '../stores/gestionUsuarios';
import { useSesionStore } from '../stores/sesion';
import { useRoute } from 'vue-router';

export function useElementosMenuFiltrados() {
  const rutaActiva = useRoute();
  const sesionStore = useSesionStore();
  const gestionUsuariosStore = useGestionUsuariosStore();
  const { usuarios } = storeToRefs(gestionUsuariosStore);

  const elementosMenuFiltrados = computed(() => {
    void usuarios.value;
    const idSesion = sesionStore.usuario?.id;
    const menusParciales =
      sesionStore.usuario?.permisos.menusVisibles ??
      (idSesion ? gestionUsuariosStore.obtenerPorId(idSesion)?.permisos.menusVisibles : undefined);
    const menus = menusVisiblesResueltos(menusParciales);
    return elementosMenuPrincipal.filter((elemento) =>
      elementoMenuVisibleParaPermisos(elemento, menus, sesionStore.usuario),
    );
  });

  const elementoMenuActivo = computed((): ElementoMenuPrincipal | undefined => {
    const nombre = rutaActiva.name;
    return elementosMenuFiltrados.value.find((elemento) =>
      elementoMenuCoincideRuta(nombre, elemento)
    );
  });

  const subelementosMenuActivo = computed(
    () => elementoMenuActivo.value?.subelementos ?? []
  );

  return {
    elementosMenuFiltrados,
    elementoMenuActivo,
    subelementosMenuActivo,
  };
}
