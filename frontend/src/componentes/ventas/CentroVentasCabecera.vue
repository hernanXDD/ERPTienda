<script setup lang="ts">
import { CheckCircle2, ShoppingCart } from 'lucide-vue-next';
import { usarCentroVentasContexto } from './centroVentasContexto';

const { pedirLimpiar, confirmarVenta, puedeConfirmarVenta, confirmandoVenta, cantidadArticulos, totalTicket } =
  usarCentroVentasContexto();

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
</script>

<template>
  <header class="pg-cab cv-cab" aria-label="Acciones del centro de ventas">
    <div class="pg-cab-txt">
      <div class="pg-cab-izq">
        <ShoppingCart :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
        <div>
          <p class="pg-eyebrow">Ventas · POS</p>
          <h1 id="titulo-centro-ventas" class="pg-titulo">Centro de ventas</h1>
          <p v-if="cantidadArticulos > 0" class="pg-sub cv-cab-resumen">
            {{ cantidadArticulos }} {{ cantidadArticulos === 1 ? 'artículo' : 'artículos' }} ·
            {{ formatoPeso.format(totalTicket) }}
          </p>
        </div>
      </div>
    </div>

    <div class="cv-cab-acciones">
      <button type="button" class="cv-btn cv-btn--sec" @click="pedirLimpiar">Limpiar</button>
      <button
        type="button"
        class="cv-btn cv-btn--prim"
        :disabled="!puedeConfirmarVenta"
        @click="confirmarVenta"
      >
        <CheckCircle2 :size="18" stroke-width="2" aria-hidden="true" />
        {{ confirmandoVenta ? 'Registrando…' : 'Confirmar venta' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.cv-cab-resumen {
  margin-top: 0.35rem;
  max-width: none;
}

.cv-cab-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-self: end;
}

@media (width >= 900px) {
  .cv-cab-acciones {
    justify-self: end;
  }
}

.cv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
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
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-borde);
}

.cv-btn--sec:hover {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.07);
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
</style>
