<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink, useRoute } from 'vue-router';
import { menusVisiblesResueltos } from '../../datos/semillaUsuariosGestion';
import {
  elementoMenuCoincideRuta,
  elementosMenuPrincipal,
} from '../../modulos/nucleo/elementosNavegacion';
import { elementoMenuVisibleParaPermisos } from '../../modulos/nucleo/menuPrincipal';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';
import { useSesionStore } from '../../stores/sesion';

const rutaActiva = useRoute();
const sesionStore = useSesionStore();
const gestionUsuariosStore = useGestionUsuariosStore();
const { usuarios } = storeToRefs(gestionUsuariosStore);

const elementosMenuFiltrados = computed(() => {
  void usuarios.value;
  const idSesion = sesionStore.usuario?.id;
  const menusParciales = idSesion
    ? gestionUsuariosStore.obtenerPorId(idSesion)?.permisos.menusVisibles
    : undefined;
  const menus = menusVisiblesResueltos(menusParciales);
  return elementosMenuPrincipal.filter((elemento) =>
    elementoMenuVisibleParaPermisos(elemento, menus)
  );
});
</script>

<template>
  <nav class="barra-fija" aria-label="Navegación principal móvil">
    <RouterLink
      v-for="elemento in elementosMenuFiltrados"
      :key="elemento.nombreRuta"
      :to="{ name: elemento.nombreRuta }"
      class="pestana"
      :class="{ activa: elementoMenuCoincideRuta(rutaActiva.name, elemento) }"
    >
      <component :is="elemento.icono" :size="22" stroke-width="1.75" aria-hidden="true" />
      <span class="etiqueta">{{ elemento.etiqueta }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.barra-fija {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 0.15rem;
  min-height: var(--alto-barra-inferior);
  padding: 0.25rem 0.35rem calc(0.25rem + env(safe-area-inset-bottom, 0px));
  background: var(--color-fondo-cabecera);
  border-top: 1px solid var(--color-borde);
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.2);
}

.pestana {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.2rem;
  font-size: 0.62rem;
  color: var(--color-texto-apagado);
  border-radius: 8px;
  border: none;
  background: transparent;
  transition: color 0.15s ease, background 0.15s ease;
}

.pestana:hover {
  color: var(--color-texto-suave);
}

.pestana.activa {
  color: var(--color-acento-hover);
  background: var(--color-acento-suave);
}

.etiqueta {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
</style>
