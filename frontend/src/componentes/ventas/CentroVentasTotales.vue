<script setup lang="ts">
import { usarCentroVentasContexto } from './centroVentasContexto';

const { totalTicket, observaciones, cantidadArticulos } = usarCentroVentasContexto();

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});
</script>

<template>
  <footer class="cv-pie" aria-label="Totales y observaciones">
    <div class="cv-pie-grid">
      <label class="cv-obs" for="cv-observaciones">
        <span class="cv-obs-etiq">Observaciones</span>
        <textarea
          id="cv-observaciones"
          v-model="observaciones"
          class="cv-obs-inp"
          rows="2"
          maxlength="500"
          placeholder="Notas internas, entrega, etc. (opcional)"
        />
      </label>

      <div class="cv-total-bloque" aria-live="polite">
        <p class="cv-total-etiq">
          Total
          <span v-if="cantidadArticulos > 0" class="cv-total-art">
            · {{ cantidadArticulos }} u.
          </span>
        </p>
        <p class="cv-total-val">{{ formatoPeso.format(totalTicket) }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.cv-pie {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cv-pie-grid {
  display: grid;
  gap: 0.75rem;
}

.cv-obs {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.cv-obs-etiq {
  font-size: 0.78rem;
  color: var(--color-texto-suave);
}

.cv-obs-inp {
  width: 100%;
  min-height: 2.5rem;
  max-height: 5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  font: inherit;
  resize: vertical;
}

.cv-obs-inp:focus {
  outline: none;
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cv-total-bloque {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-acento-borde);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%);
}

.cv-total-etiq {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-total-art {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
}

.cv-total-val {
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: var(--color-acento-hover);
}

@media (min-width: 901px) {
  .cv-pie-grid {
    grid-template-columns: 1fr min(16rem, 35%);
    align-items: stretch;
  }
}
</style>
