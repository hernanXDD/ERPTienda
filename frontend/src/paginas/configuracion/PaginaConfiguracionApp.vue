<script setup lang="ts">
import { Settings2 } from 'lucide-vue-next';
import SeccionCargaInicialCatalogo from '../../componentes/configuracion/SeccionCargaInicialCatalogo.vue';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('configuracion-app');
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-configuracion-app">
    <div class="pg-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Settings2 :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Sistema · Configuración</p>
              <h1 id="titulo-configuracion-app" class="pg-titulo">Configuración de app</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
      </header>

      <div class="pg-cuerpo cfg-app-cuerpo">
        <p class="cfg-app-aviso" role="status">
          Herramientas reservadas al equipo de implementación. El cliente de la tienda no usa esta
          sección: vos descargás la plantilla, se la enviás para completar y acá importás el Excel
          devuelto.
        </p>

        <SeccionCargaInicialCatalogo />
      </div>
    </div>
  </section>
</template>

<style scoped>
.cfg-app-cuerpo {
  padding: 1.25rem clamp(1rem, 3vw, 1.65rem) 1.5rem;
}

.cfg-app-aviso {
  margin: 0 0 1.25rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px dashed var(--color-acento-borde);
  background: var(--color-acento-suave);
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}
</style>
