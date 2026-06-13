<script setup lang="ts">
import { provide } from 'vue';
import { CLAVE_CENTRO_VENTAS, useCentroVentas } from '../../composables/useCentroVentas';
import CentroVentasCabecera from '../../componentes/ventas/CentroVentasCabecera.vue';
import CentroVentasClienteCobro from '../../componentes/ventas/CentroVentasClienteCobro.vue';
import CentroVentasIngreso from '../../componentes/ventas/CentroVentasIngreso.vue';
import CentroVentasLineas from '../../componentes/ventas/CentroVentasLineas.vue';
import CentroVentasTotales from '../../componentes/ventas/CentroVentasTotales.vue';
import CentroVentasExitoVenta from '../../componentes/ventas/CentroVentasExitoVenta.vue';

const centroVentas = useCentroVentas();
provide(CLAVE_CENTRO_VENTAS, centroVentas);

const { mensajeToast } = centroVentas;
</script>

<template>
  <section class="pg-wrap pg-wrap--centro-ventas" aria-labelledby="titulo-centro-ventas">
    <div class="pg-marco pg-marco--centro-ventas">
      <CentroVentasCabecera />

      <div class="centro-ventas cv">
        <CentroVentasClienteCobro />

        <div class="cv-cuerpo">
          <CentroVentasIngreso />
          <CentroVentasLineas />
        </div>

        <CentroVentasTotales />

        <Transition name="cv-toast">
          <div v-if="mensajeToast" class="cv-toast" role="status" aria-live="polite">
            {{ mensajeToast }}
          </div>
        </Transition>

        <CentroVentasExitoVenta />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg-wrap--centro-ventas {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  padding-bottom: 0.75rem;
}

.pg-marco--centro-ventas {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cv {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: var(--color-fondo-elevado);
}

.cv-cuerpo {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (min-width: 900px) {
  .cv-cuerpo {
    flex-direction: row;
  }

  .cv-cuerpo :deep(.cv-ingreso) {
    flex: 0 0 min(22rem, 32%);
    max-width: 22rem;
    overflow: auto;
  }

  .cv-cuerpo :deep(.cv-lineas) {
    flex: 1;
  }
}

.cv-toast {
  position: absolute;
  left: 50%;
  bottom: 5.5rem;
  transform: translateX(-50%);
  z-index: 20;
  max-width: min(22rem, calc(100% - 2rem));
  padding: 0.65rem 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: rgba(15, 23, 42, 0.96);
  color: var(--color-texto);
  font-size: 0.84rem;
  line-height: 1.4;
  text-align: center;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.cv-toast-enter-active,
.cv-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.cv-toast-enter-from,
.cv-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}

@media (min-width: 801px) {
  .cv-toast {
    bottom: 1.25rem;
  }
}
</style>
