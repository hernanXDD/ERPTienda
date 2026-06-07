<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { RouterLink, useRoute } from 'vue-router';
import { useElementosMenuFiltrados } from '../../composables/useElementosMenuFiltrados';

const esMovil = useMediaQuery('(max-width: 767px)');
const rutaActiva = useRoute();
const { elementoMenuActivo, subelementosMenuActivo } = useElementosMenuFiltrados();
</script>

<template>
  <nav
    v-if="esMovil && subelementosMenuActivo.length > 0"
    class="submenu-movil"
    :aria-label="`Subsecciones de ${elementoMenuActivo?.etiqueta ?? 'módulo'}`"
  >
    <div class="submenu-movil-scroll">
      <RouterLink
        v-for="sub in subelementosMenuActivo"
        :key="sub.nombreRuta"
        :to="{ name: sub.nombreRuta }"
        class="submenu-enlace"
        :class="{ activo: rutaActiva.name === sub.nombreRuta }"
      >
        {{ sub.etiqueta }}
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.submenu-movil {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.submenu-movil-scroll {
  display: flex;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.submenu-movil-scroll::-webkit-scrollbar {
  display: none;
}

.submenu-enlace {
  flex-shrink: 0;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-texto-apagado);
  border: 1px solid transparent;
  white-space: nowrap;
}

.submenu-enlace:hover {
  color: var(--color-texto-suave);
  background: rgba(255, 255, 255, 0.04);
}

.submenu-enlace.activo {
  color: var(--color-texto);
  background: var(--color-acento-suave);
  border-color: var(--color-acento-borde);
}
</style>
