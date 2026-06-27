<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next';
import { usarCentroVentasContexto } from './centroVentasContexto';
import { useEsMovil } from '../../composables/useEsMovil';
import { formatearMoneda } from '../../utilidades/formatoMoneda';

const esMovil = useEsMovil();

const {
  totalTicket,
  cantidadArticulos,
  puedeConfirmarVenta,
  confirmandoVenta,
  motivoNoConfirmarVenta,
  confirmarVenta,
  pedirLimpiar,
} = usarCentroVentasContexto();

</script>

<template>
  <Teleport v-if="esMovil" to="body">
    <footer class="cv-pie-mobile" aria-label="Confirmación rápida de venta">
      <div class="cv-pie-mobile-total">
        <span class="cv-pie-mobile-etiq">Total</span>
        <strong class="cv-pie-mobile-monto">{{ formatearMoneda(totalTicket) }}</strong>
        <span v-if="cantidadArticulos > 0" class="cv-pie-mobile-art">
          {{ cantidadArticulos }} {{ cantidadArticulos === 1 ? 'artículo' : 'artículos' }}
        </span>
        <span v-else class="cv-pie-mobile-art">Sin productos en el ticket</span>
      </div>
      <div class="cv-pie-mobile-acciones">
        <button type="button" class="cv-pie-mobile-limpiar" @click="pedirLimpiar">Limpiar</button>
        <button
          type="button"
          class="cv-pie-mobile-btn"
          :disabled="!puedeConfirmarVenta"
          :title="motivoNoConfirmarVenta || undefined"
          @click="confirmarVenta"
        >
          <CheckCircle2 :size="18" stroke-width="2" aria-hidden="true" />
          {{ confirmandoVenta ? 'Registrando…' : 'Confirmar venta' }}
        </button>
      </div>
    </footer>
  </Teleport>
</template>

<style scoped>
.cv-pie-mobile {
  display: none;
}

@media (max-width: 900px) {
  .cv-pie-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 45;
    padding: 0.65rem 0.85rem calc(0.65rem + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-borde);
    background: color-mix(in srgb, var(--color-fondo-elevado) 94%, transparent);
    backdrop-filter: blur(10px);
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.22);
  }

  .cv-pie-mobile-total {
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
    min-width: 0;
  }

  .cv-pie-mobile-etiq {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-texto-apagado);
  }

  .cv-pie-mobile-monto {
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-acento-hover);
  }

  .cv-pie-mobile-art {
    font-size: 0.72rem;
    color: var(--color-texto-apagado);
  }

  .cv-pie-mobile-acciones {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.4rem;
  }

  .cv-pie-mobile-limpiar {
    flex-shrink: 0;
    min-height: 2.65rem;
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--color-borde);
    border-radius: var(--radio-control);
    background: var(--color-fondo-cabecera);
    color: var(--color-texto-suave);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .cv-pie-mobile-limpiar:hover {
    color: var(--color-texto);
    background: var(--color-hover-neutro);
  }

  .cv-pie-mobile-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 2.65rem;
    padding: 0.5rem 0.85rem;
    border: none;
    border-radius: var(--radio-control);
    background: linear-gradient(180deg, var(--color-acento) 0%, var(--color-acento-intenso) 100%);
    color: var(--color-texto-sobre-acento);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
  }

  .cv-pie-mobile-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
