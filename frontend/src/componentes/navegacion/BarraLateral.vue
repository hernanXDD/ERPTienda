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

function claveElemento(idx: number, conSub: boolean) {
  return conSub ? `grupo-${idx}` : `item-${idx}`;
}
</script>

<template>
  <aside class="lateral" aria-label="Navegación principal">
    <nav class="nav" aria-label="Secciones">
      <template v-for="(elemento, idx) in elementosMenuFiltrados" :key="claveElemento(idx, Boolean(elemento.subelementos))">
        <template v-if="elemento.subelementos?.length">
          <div v-if="elementoMenuCoincideRuta(rutaActiva.name, elemento)" class="grupo">
            <div class="grupo-cabecera">
              <component
                :is="elemento.icono"
                :size="20"
                stroke-width="1.75"
                aria-hidden="true"
                class="icono-grupo"
              />
              <span>{{ elemento.etiqueta }}</span>
            </div>
            <RouterLink
              v-for="sub in elemento.subelementos"
              :key="sub.nombreRuta"
              :to="{ name: sub.nombreRuta }"
              class="enlace enlace-sub"
              :class="{ activo: rutaActiva.name === sub.nombreRuta }"
            >
              {{ sub.etiqueta }}
            </RouterLink>
          </div>

          <RouterLink
            v-else
            :to="{ name: elemento.nombreRuta }"
            class="enlace"
          >
            <component :is="elemento.icono" :size="20" stroke-width="1.75" aria-hidden="true" class="icono" />
            <span>{{ elemento.etiqueta }}</span>
          </RouterLink>
        </template>

        <RouterLink
          v-else
          :to="{ name: elemento.nombreRuta }"
          class="enlace"
          :class="{ activo: rutaActiva.name === elemento.nombreRuta }"
        >
          <component :is="elemento.icono" :size="20" stroke-width="1.75" aria-hidden="true" class="icono" />
          <span>{{ elemento.etiqueta }}</span>
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.lateral {
  flex-shrink: 0;
  width: var(--ancho-barra-lateral);
  border-right: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.nav {
  display: flex;
  flex-direction: column;
  padding: 0.65rem 0.45rem;
  gap: 0.35rem;
}

.grupo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.25rem;
}

.grupo-cabecera {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem 0.25rem;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.icono-grupo {
  flex-shrink: 0;
  opacity: 0.85;
}

.enlace {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radio-control);
  font-size: 0.9rem;
  color: var(--color-texto-suave);
  border: 1px solid transparent;
}

.enlace-sub {
  padding-left: 1.5rem;
  font-size: 0.86rem;
}

.enlace:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-texto);
}

.enlace.activo {
  background: var(--color-acento-suave);
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
}

.icono {
  flex-shrink: 0;
}
</style>
