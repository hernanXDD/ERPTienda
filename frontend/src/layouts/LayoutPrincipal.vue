<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import BarraInferiorMovil from '../componentes/navegacion/BarraInferiorMovil.vue';
import BarraLateral from '../componentes/navegacion/BarraLateral.vue';
import BarraSuperior from '../componentes/navegacion/BarraSuperior.vue';

const esMovil = useMediaQuery('(max-width: 767px)');
</script>

<template>
  <div class="shell" data-vista="principal">
    <BarraSuperior />
    <div class="cuerpo">
      <BarraLateral v-if="!esMovil" />
      <main
        class="contenido"
        :class="{ 'con-barra-movil': esMovil }"
        id="contenido-principal"
        tabindex="-1"
      >
        <div class="relleno">
          <router-view />
        </div>
      </main>
    </div>
    <BarraInferiorMovil v-if="esMovil" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-fondo);
  color: var(--color-texto);
  overflow-x: hidden;
}

.cuerpo {
  flex: 1;
  display: flex;
  min-height: 0;
}

.contenido {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.contenido.con-barra-movil {
  padding-bottom: var(--alto-barra-inferior);
}

.relleno {
  padding: 1rem 1.1rem 1.25rem;
  max-width: 1200px;
  margin-inline: auto;
  width: 100%;
}

@media (min-width: 768px) {
  .relleno {
    padding: 1.25rem 1.5rem 1.5rem;
  }
}
</style>
