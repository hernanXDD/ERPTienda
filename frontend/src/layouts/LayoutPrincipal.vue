<script setup lang="ts">
import { onMounted } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import BarraInferiorMovil from '../componentes/navegacion/BarraInferiorMovil.vue';
import BarraLateral from '../componentes/navegacion/BarraLateral.vue';
import BarraSubmenuMovil from '../componentes/navegacion/BarraSubmenuMovil.vue';
import BarraSuperior from '../componentes/navegacion/BarraSuperior.vue';
import { cargarDatosMaestros, errorCargaDatosMaestros } from '../stores/inicializacionDatos';

const esMovil = useMediaQuery('(max-width: 767px)');

onMounted(() => {
  void cargarDatosMaestros();
});
</script>

<template>
  <div class="shell" data-vista="principal">
    <BarraSuperior />
    <div class="cuerpo">
      <BarraLateral v-if="!esMovil" />
      <div class="columna-principal">
        <BarraSubmenuMovil />
        <main
          class="contenido"
          :class="{ 'con-barra-movil': esMovil }"
          id="contenido-principal"
          tabindex="-1"
        >
        <p v-if="errorCargaDatosMaestros" class="aviso-carga-maestros" role="alert">
          {{ errorCargaDatosMaestros }}
        </p>
        <div class="relleno">
          <router-view />
        </div>
        </main>
      </div>
    </div>
    <BarraInferiorMovil v-if="esMovil" />
  </div>
</template>

<style scoped>
.shell {
  height: 100dvh;
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

.columna-principal {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
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

.relleno:has(.pg-wrap) {
  max-width: none;
  padding-inline: clamp(0.35rem, 1.5vw, 0.75rem);
}

.contenido:has(.centro-ventas) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.contenido:has(.cfg-ficha-vista) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.relleno:has(.centro-ventas) {
  flex: 1;
  min-height: 0;
  height: 100%;
  max-width: none;
  padding: 0.12rem 0.45rem 0.15rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.relleno:has(.cfg-ficha-vista) {
  flex: 1;
  min-height: 0;
  height: 100%;
  max-width: none;
  padding: 0.35rem clamp(0.35rem, 1.2vw, 0.65rem) 0.4rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (min-width: 768px) {
  .relleno {
    padding: 1.25rem 1.5rem 1.5rem;
  }

  .relleno:has(.centro-ventas) {
    padding: 0.15rem 0.65rem 0.2rem;
  }

  .relleno:has(.cfg-ficha-vista) {
    padding: 0.45rem 0.75rem 0.5rem;
  }
}

.aviso-carga-maestros {
  margin: 0 0 0.85rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid rgba(240, 120, 120, 0.45);
  background: rgba(120, 28, 28, 0.22);
  color: #ffc9c9;
  font-size: 0.9375rem;
  line-height: 1.45;
}
</style>
