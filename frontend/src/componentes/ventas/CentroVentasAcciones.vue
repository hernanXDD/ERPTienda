<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next';
import { usarCentroVentasContexto } from './centroVentasContexto';

const {
  pedirLimpiar,
  confirmarVenta,
  puedeConfirmarVenta,
  confirmandoVenta,
  motivoNoConfirmarVenta,
} = usarCentroVentasContexto();
</script>

<template>
  <div class="cv-acciones" aria-label="Acciones del ticket">
    <button type="button" class="cv-btn cv-btn--sec" @click="pedirLimpiar">Limpiar</button>
    <button
      type="button"
      class="cv-btn cv-btn--prim cv-btn--confirmar"
      :disabled="!puedeConfirmarVenta"
      :title="motivoNoConfirmarVenta || undefined"
      @click="confirmarVenta"
    >
      <CheckCircle2 :size="18" stroke-width="2" aria-hidden="true" />
      {{ confirmandoVenta ? 'Registrando…' : 'Confirmar venta' }}
    </button>
  </div>
</template>

<style scoped>
.cv-acciones {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.45rem;
  min-width: 9.5rem;
}

.cv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  min-height: 2.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radio-control);
  font-size: 0.86rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.cv-btn--sec {
  color: var(--color-texto-suave);
  background: var(--color-fondo-elevado);
  border-color: var(--color-borde);
}

.cv-btn--sec:hover {
  color: var(--color-texto);
  background: var(--color-hover-neutro);
}

.cv-btn--prim {
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento) 0%, var(--color-acento-intenso) 100%);
}

.cv-btn--prim:hover:not(:disabled) {
  background: linear-gradient(180deg, var(--color-acento-hover) 0%, var(--color-acento) 100%);
}

.cv-btn--prim:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cv-btn--confirmar {
  min-height: 2.75rem;
}

@media (max-width: 900px) {
  .cv-acciones {
    display: none;
  }
}
</style>
