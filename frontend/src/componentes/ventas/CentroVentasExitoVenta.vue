<script setup lang="ts">
import { CheckCircle2, Printer, ShoppingCart } from 'lucide-vue-next';
import { nextTick, useTemplateRef, watch } from 'vue';
import { usarCentroVentasContexto } from './centroVentasContexto';

const {
  ventaConfirmada,
  cerrarExitoVenta,
  imprimirResumenVentaConfirmada,
} = usarCentroVentasContexto();

const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

watch(ventaConfirmada, async (venta) => {
  await nextTick();
  if (venta) {
    refDialog.value?.showModal();
  } else {
    refDialog.value?.close();
  }
});

function volverCentroVentas() {
  cerrarExitoVenta();
}

function alCerrarDialog() {
  if (ventaConfirmada.value) {
    cerrarExitoVenta();
  }
}
</script>

<template>
  <dialog
    ref="refDialog"
    class="cv-exito-modal"
    aria-labelledby="cv-exito-titulo"
    aria-describedby="cv-exito-desc"
    @close="alCerrarDialog"
    @cancel.prevent="volverCentroVentas"
  >
    <div v-if="ventaConfirmada" class="cv-exito-panel">
      <div class="cv-exito-anim" aria-hidden="true">
        <span class="cv-exito-anillo" />
        <CheckCircle2 class="cv-exito-ico" :size="56" stroke-width="1.75" />
      </div>

      <h2 id="cv-exito-titulo" class="cv-exito-titulo">Venta realizada</h2>

      <p id="cv-exito-desc" class="cv-exito-det">
        <span class="cv-exito-num">{{ ventaConfirmada.numero }}</span>
        ·
        {{ formatoPeso.format(ventaConfirmada.total) }}
      </p>

      <p class="cv-exito-cli">{{ ventaConfirmada.nombreClienteMostrar }}</p>

      <div class="cv-exito-acciones">
        <button type="button" class="cv-exito-btn cv-exito-btn--sec" @click="imprimirResumenVentaConfirmada">
          <Printer :size="18" stroke-width="2" aria-hidden="true" />
          Imprimir comprobante
        </button>
        <button type="button" class="cv-exito-btn cv-exito-btn--prim" @click="volverCentroVentas">
          <ShoppingCart :size="18" stroke-width="2" aria-hidden="true" />
          Volver a centro de ventas
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.cv-exito-modal {
  padding: 0;
  border: none;
  background: transparent;
  max-width: none;
  max-height: none;
}

.cv-exito-modal::backdrop {
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(5px);
  animation: cv-exito-backdrop 0.28s ease;
}

.cv-exito-modal[open] .cv-exito-panel {
  animation: cv-exito-panel 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.cv-exito-panel {
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.65rem 1.35rem 1.35rem;
  border-radius: calc(var(--radio-control) + 4px);
  border: 1px solid var(--color-borde);
  background: linear-gradient(180deg, var(--color-fondo-elevado) 0%, var(--color-fondo-cabecera) 100%);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
  text-align: center;
}

.cv-exito-anim {
  position: relative;
  display: grid;
  place-items: center;
  width: 5rem;
  height: 5rem;
  margin: 0 auto 0.85rem;
}

.cv-exito-anillo {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--color-acento-borde);
  animation: cv-exito-pulso 0.65s ease-out;
}

.cv-exito-ico {
  color: var(--color-acento-hover);
  animation: cv-exito-ico 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}

.cv-exito-titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  animation: cv-exito-texto 0.4s ease 0.12s both;
}

.cv-exito-det {
  margin: 0.45rem 0 0;
  font-size: 0.92rem;
  color: var(--color-texto-suave);
  font-variant-numeric: tabular-nums;
  animation: cv-exito-texto 0.4s ease 0.18s both;
}

.cv-exito-num {
  font-weight: 700;
  color: var(--color-acento-hover);
}

.cv-exito-cli {
  margin: 0.35rem 0 0;
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
  animation: cv-exito-texto 0.4s ease 0.22s both;
}

.cv-exito-acciones {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.25rem;
  animation: cv-exito-texto 0.4s ease 0.28s both;
}

.cv-exito-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.55rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radio-control);
  font-size: 0.86rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

.cv-exito-btn:active {
  transform: scale(0.98);
}

.cv-exito-btn--sec {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-borde);
}

.cv-exito-btn--sec:hover {
  background: rgba(255, 255, 255, 0.09);
}

.cv-exito-btn--prim {
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento) 0%, var(--color-acento-intenso) 100%);
}

.cv-exito-btn--prim:hover {
  background: linear-gradient(180deg, var(--color-acento-hover) 0%, var(--color-acento) 100%);
}

@keyframes cv-exito-backdrop {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cv-exito-panel {
  from {
    opacity: 0;
    transform: scale(0.88) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes cv-exito-pulso {
  0% {
    transform: scale(0.6);
    opacity: 0.2;
  }
  70% {
    transform: scale(1.08);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes cv-exito-ico {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes cv-exito-texto {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
