<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { elementoMenuCoincideRuta } from '../../modulos/nucleo/elementosNavegacion';
import { useElementosMenuFiltrados } from '../../composables/useElementosMenuFiltrados';

const rutaActiva = useRoute();
const { elementosMenuFiltrados } = useElementosMenuFiltrados();
</script>

<template>
  <nav class="barra-fija" aria-label="Navegación principal móvil">
    <div class="barra-fija-scroll">
      <RouterLink
        v-for="elemento in elementosMenuFiltrados"
        :key="elemento.nombreRuta"
        :to="{ name: elemento.nombreRuta }"
        class="pestana"
        :class="{ activa: elementoMenuCoincideRuta(rutaActiva.name, elemento) }"
      >
        <component :is="elemento.icono" :size="24" stroke-width="1.75" aria-hidden="true" />
        <span class="etiqueta">{{ elemento.etiqueta }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.barra-fija {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--color-fondo-cabecera);
  border-top: 1px solid var(--color-borde);
  box-shadow: 0 -6px 22px rgba(0, 0, 0, 0.28);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.barra-fija-scroll {
  display: flex;
  align-items: stretch;
  gap: 0.15rem;
  min-height: var(--alto-barra-inferior);
  padding: 0.3rem 0.45rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.barra-fija-scroll::-webkit-scrollbar {
  display: none;
}

.pestana {
  flex: 0 0 auto;
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  min-width: 4.85rem;
  max-width: 5.75rem;
  min-height: 3.35rem;
  padding: 0.28rem 0.35rem;
  font-size: 0.64rem;
  color: var(--color-texto-apagado);
  border-radius: 12px;
  border: none;
  background: transparent;
  transition: color 0.15s ease, background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
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
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: 0.01em;
}

@media (max-width: 767px) {
  .pestana {
    min-width: 4.35rem;
    max-width: 5.25rem;
  }

  .etiqueta {
    font-size: 0.6rem;
  }
}
</style>
