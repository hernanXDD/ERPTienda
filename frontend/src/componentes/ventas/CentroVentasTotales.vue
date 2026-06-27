<script setup lang="ts">
import { usarCentroVentasContexto } from './centroVentasContexto';
import CentroVentasAcciones from './CentroVentasAcciones.vue';
import { formatearMoneda } from '../../utilidades/formatoMoneda';

const {
  subtotalTicket,
  totalTicket,
  cantidadArticulos,
  tipoAjusteTicket,
  porcentajeAjusteTexto,
  etiquetaAjusteTicketActivo,
  montoAjusteTicketAbsoluto,
  hayAjusteTicketActivo,
  ajusteMontoTicket,
  observaciones,
  cuponAplicado,
} = usarCentroVentasContexto();

function elegirTipoAjuste(tipo: 'NINGUNO' | 'DESCUENTO' | 'RECARGO') {
  if (cuponAplicado.value) return;
  tipoAjusteTicket.value = tipo;
  if (tipo === 'NINGUNO') {
    porcentajeAjusteTexto.value = '';
  }
}
</script>

<template>
  <footer class="cv-pie" aria-label="Totales y observaciones">
    <div class="cv-pie-grid">
      <div class="cv-pie-izq">
        <fieldset class="cv-ajuste-fs" :class="{ 'cv-ajuste-fs--cupon': cuponAplicado }">
          <legend class="cv-ajuste-etiq">Ajuste del ticket</legend>
          <p v-if="cuponAplicado" class="cv-ajuste-cupon-aviso">
            Descuento aplicado por cupón {{ cuponAplicado.numero }}.
            Quitá el cupón en «Cliente y cobro» para modificar el ajuste manualmente.
          </p>
          <div
            class="cv-ajuste-tipos"
            role="radiogroup"
            aria-label="Tipo de ajuste"
            :aria-disabled="cuponAplicado ? 'true' : undefined"
          >
            <button
              type="button"
              role="radio"
              class="cv-ajuste-tipo"
              :class="{ 'cv-ajuste-tipo--on': tipoAjusteTicket === 'NINGUNO' }"
              :aria-checked="tipoAjusteTicket === 'NINGUNO'"
              :disabled="!!cuponAplicado"
              @click="elegirTipoAjuste('NINGUNO')"
            >
              Sin ajuste
            </button>
            <button
              type="button"
              role="radio"
              class="cv-ajuste-tipo"
              :class="{ 'cv-ajuste-tipo--on': tipoAjusteTicket === 'DESCUENTO' }"
              :aria-checked="tipoAjusteTicket === 'DESCUENTO'"
              :disabled="!!cuponAplicado"
              @click="elegirTipoAjuste('DESCUENTO')"
            >
              Descuento
            </button>
            <button
              type="button"
              role="radio"
              class="cv-ajuste-tipo"
              :class="{ 'cv-ajuste-tipo--on': tipoAjusteTicket === 'RECARGO' }"
              :aria-checked="tipoAjusteTicket === 'RECARGO'"
              :disabled="!!cuponAplicado"
              @click="elegirTipoAjuste('RECARGO')"
            >
              Recargo
            </button>
          </div>

          <div v-if="tipoAjusteTicket !== 'NINGUNO'" class="cv-ajuste-campos">
            <label class="cv-ajuste-campo" :for="`cv-pct-${tipoAjusteTicket}`">
              <span class="cv-ajuste-campo-etq">
                {{ tipoAjusteTicket === 'DESCUENTO' ? 'Descuento' : 'Recargo' }} (%)
              </span>
              <div class="cv-ajuste-inp-wrap">
                <input
                  :id="`cv-pct-${tipoAjusteTicket}`"
                  v-model="porcentajeAjusteTexto"
                  type="text"
                  inputmode="decimal"
                  class="cv-ajuste-inp"
                  placeholder="Ej. 10"
                  autocomplete="off"
                  :readonly="!!cuponAplicado"
                />
                <span class="cv-ajuste-suf" aria-hidden="true">%</span>
              </div>
            </label>
            <p v-if="hayAjusteTicketActivo" class="cv-ajuste-prev">
              Sobre {{ formatearMoneda(subtotalTicket) }}:
              <strong>
                {{ ajusteMontoTicket < 0 ? '−' : '+' }}{{ formatearMoneda(montoAjusteTicketAbsoluto) }}
              </strong>
            </p>
            <p v-else class="cv-ajuste-ayuda">
              Ingresá el porcentaje; el sistema calcula el monto sobre el subtotal de artículos.
            </p>
          </div>
        </fieldset>

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
      </div>

      <CentroVentasAcciones />

      <div class="cv-total-bloque" aria-live="polite">
        <div class="cv-total-filas">
          <div class="cv-total-fila">
            <span class="cv-total-fila-etq">Subtotal artículos</span>
            <span class="cv-total-fila-val">{{ formatearMoneda(subtotalTicket) }}</span>
          </div>
          <div v-if="hayAjusteTicketActivo" class="cv-total-fila cv-total-fila--ajuste">
            <span class="cv-total-fila-etq">{{ etiquetaAjusteTicketActivo }}</span>
            <span class="cv-total-fila-val">
              {{ ajusteMontoTicket < 0 ? '−' : '+' }}{{ formatearMoneda(montoAjusteTicketAbsoluto) }}
            </span>
          </div>
        </div>
        <p class="cv-total-etiq">
          Total a cobrar
          <span v-if="cantidadArticulos > 0" class="cv-total-art">
            · {{ cantidadArticulos }} u.
          </span>
        </p>
        <p class="cv-total-val">{{ formatearMoneda(totalTicket) }}</p>
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

.cv-pie-izq {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.cv-ajuste-fs {
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cv-ajuste-etiq {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-ajuste-fs--cupon {
  opacity: 0.92;
}

.cv-ajuste-cupon-aviso {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
}

.cv-ajuste-tipo:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cv-ajuste-tipos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.cv-ajuste-tipo {
  padding: 0.28rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto-suave);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.cv-ajuste-tipo--on {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
}

.cv-ajuste-campos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 16rem;
}

.cv-ajuste-campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cv-ajuste-campo-etq {
  font-size: 0.78rem;
  color: var(--color-texto-suave);
}

.cv-ajuste-inp-wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
  overflow: hidden;
}

.cv-ajuste-inp-wrap:focus-within {
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cv-ajuste-inp {
  flex: 1;
  min-width: 0;
  min-height: 2rem;
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: var(--color-texto);
  font: inherit;
  font-size: 0.88rem;
}

.cv-ajuste-inp:focus {
  outline: none;
}

.cv-ajuste-suf {
  display: flex;
  align-items: center;
  padding: 0 0.55rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-cabecera);
  border-left: 1px solid var(--color-borde);
}

.cv-ajuste-prev {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--color-texto-suave);
}

.cv-ajuste-prev strong {
  color: var(--color-acento-hover);
  font-variant-numeric: tabular-nums;
}

.cv-ajuste-ayuda {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.4;
  color: var(--color-texto-apagado);
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
  gap: 0.2rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-acento-borde);
  background: linear-gradient(
    135deg,
    var(--color-acento-suave) 0%,
    var(--color-fondo-cabecera) 100%
  );
}

.cv-total-filas {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.15rem;
}

.cv-total-fila {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  font-size: 0.78rem;
  color: var(--color-texto-suave);
}

.cv-total-fila--ajuste {
  color: var(--color-acento-hover);
  font-weight: 500;
}

.cv-total-fila-val {
  font-variant-numeric: tabular-nums;
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
    grid-template-columns: 1fr auto min(18rem, 38%);
    align-items: stretch;
  }
}
</style>
