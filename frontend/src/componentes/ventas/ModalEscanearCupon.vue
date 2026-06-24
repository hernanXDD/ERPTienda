<script setup lang="ts">
import { AlertTriangle, Loader2, ScanBarcode, X } from 'lucide-vue-next';
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import {
  usarCentroVentasContexto,
} from './centroVentasContexto';
import type { ErrorCuponEscaneo } from '../../composables/useCentroVentas';

const {
  modalEscanearCuponAbierto,
  codigoCuponEscaneo,
  errorEscanearCupon,
  validandoCupon,
  aplicarCodigoCupon,
  cerrarModalEscanearCupon,
} = usarCentroVentasContexto();

const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');
const refInputCupon = useTemplateRef<HTMLInputElement>('refInputCupon');

const tituloAlerta = computed(() => {
  const error = errorEscanearCupon.value;
  if (!error) return '';
  switch (error.tipo) {
    case 'vencido':
      return 'Cupón vencido';
    case 'usado':
      return 'Cupón ya utilizado';
    case 'anulado':
      return 'Cupón anulado';
    case 'otro_cliente':
      return 'Cupón de otro cliente';
    case 'no_encontrado':
      return 'Cupón no encontrado';
    case 'vacio':
      return 'Falta el código';
    default:
      return 'No se pudo aplicar el cupón';
  }
});

watch(modalEscanearCuponAbierto, async (abierto) => {
  await nextTick();
  if (abierto) {
    refDialog.value?.showModal();
    enfocarInputCupon();
  } else {
    refDialog.value?.close();
  }
});

function enfocarInputCupon() {
  nextTick(() => {
    refInputCupon.value?.focus();
    refInputCupon.value?.select?.();
  });
}

function alCerrarDialog() {
  if (modalEscanearCuponAbierto.value) {
    cerrarModalEscanearCupon();
  }
}

function cancelar() {
  cerrarModalEscanearCupon();
}

async function confirmarEscaneo() {
  await aplicarCodigoCupon();
  if (modalEscanearCuponAbierto.value) {
    enfocarInputCupon();
  }
}

function claseAlerta(error: ErrorCuponEscaneo): string {
  if (error.tipo === 'vencido' || error.tipo === 'usado' || error.tipo === 'anulado') {
    return 'cv-cupon-alerta--peligro';
  }
  return 'cv-cupon-alerta--aviso';
}
</script>

<template>
  <dialog
    ref="refDialog"
    class="cv-cupon-modal"
    aria-labelledby="cv-cupon-modal-titulo"
    aria-describedby="cv-cupon-modal-desc"
    @close="alCerrarDialog"
    @cancel.prevent="cancelar"
  >
    <div class="cv-cupon-panel" @click.stop>
      <header class="cv-cupon-cab">
        <div class="cv-cupon-cab-texto">
          <h2 id="cv-cupon-modal-titulo" class="cv-cupon-titulo">Escanear cupón</h2>
          <p id="cv-cupon-modal-desc" class="cv-cupon-sub">
            Escaneá el código de barras del cupón con el lector. La validación es automática al
            leer el código.
          </p>
        </div>
        <button
          type="button"
          class="cv-cupon-cerrar"
          aria-label="Cerrar"
          :disabled="validandoCupon"
          @click="cancelar"
        >
          <X :size="18" stroke-width="2" aria-hidden="true" />
        </button>
      </header>

      <div
        v-if="errorEscanearCupon"
        class="cv-cupon-alerta"
        :class="claseAlerta(errorEscanearCupon)"
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle class="cv-cupon-alerta-ico" :size="20" stroke-width="2" aria-hidden="true" />
        <div class="cv-cupon-alerta-cuerpo">
          <p class="cv-cupon-alerta-tit">{{ tituloAlerta }}</p>
          <p class="cv-cupon-alerta-msg">{{ errorEscanearCupon.mensaje }}</p>
        </div>
      </div>

      <div class="cv-cupon-escaneo">
        <label class="cv-cupon-campo" for="cv-inp-cupon-modal">
          <span class="cv-cupon-campo-etiq">
            <ScanBarcode :size="16" stroke-width="2" aria-hidden="true" />
            Código del cupón
          </span>
          <input
            id="cv-inp-cupon-modal"
            ref="refInputCupon"
            v-model="codigoCuponEscaneo"
            type="text"
            class="cv-cupon-inp"
            placeholder="Esperando escaneo…"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="done"
            :disabled="validandoCupon"
            @keydown.enter.prevent="confirmarEscaneo"
          />
        </label>

        <p v-if="validandoCupon" class="cv-cupon-estado" role="status">
          <Loader2 class="cv-cupon-estado-ico" :size="16" stroke-width="2" aria-hidden="true" />
          Validando cupón…
        </p>
        <p v-else class="cv-cupon-estado cv-cupon-estado--ayuda">
          Si el cupón está vencido o ya fue usado, verás una alerta aquí.
        </p>
      </div>

      <footer class="cv-cupon-pie">
        <button
          type="button"
          class="cv-cupon-btn cv-cupon-btn--sec"
          :disabled="validandoCupon"
          @click="cancelar"
        >
          Cancelar
        </button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.cv-cupon-modal {
  padding: 0;
  border: none;
  background: transparent;
  max-width: none;
  max-height: none;
}

.cv-cupon-modal::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(4px);
}

.cv-cupon-panel {
  width: min(24rem, calc(100vw - 2rem));
  padding: 1.1rem 1.15rem 1rem;
  border-radius: calc(var(--radio-control) + 4px);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.cv-cupon-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.cv-cupon-cab-texto {
  min-width: 0;
}

.cv-cupon-titulo {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.cv-cupon-sub {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.cv-cupon-cerrar {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-suave);
  cursor: pointer;
}

.cv-cupon-cerrar:hover:not(:disabled) {
  color: var(--color-texto);
  background: var(--color-hover-neutro);
}

.cv-cupon-cerrar:disabled {
  opacity: 0.5;
  cursor: wait;
}

.cv-cupon-alerta {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-bottom: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cv-cupon-alerta--peligro {
  border-color: var(--color-peligro-borde);
  background: var(--color-peligro-suave);
}

.cv-cupon-alerta--aviso {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.cv-cupon-alerta-ico {
  flex-shrink: 0;
  margin-top: 0.05rem;
  color: var(--color-peligro);
}

.cv-cupon-alerta--aviso .cv-cupon-alerta-ico {
  color: var(--color-acento-hover);
}

.cv-cupon-alerta-tit {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
}

.cv-cupon-alerta-msg {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--color-texto-suave);
}

.cv-cupon-escaneo {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cv-cupon-campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cv-cupon-campo-etiq {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cv-cupon-inp {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.55rem 0.7rem;
  border: 2px solid var(--color-acento-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.cv-cupon-inp:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-acento-suave);
}

.cv-cupon-inp:disabled {
  opacity: 0.65;
}

.cv-cupon-estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.74rem;
  color: var(--color-texto-apagado);
}

.cv-cupon-estado--ayuda {
  line-height: 1.35;
}

.cv-cupon-estado-ico {
  animation: cv-cupon-girar 0.8s linear infinite;
}

.cv-cupon-pie {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-borde);
}

.cv-cupon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radio-control);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.cv-cupon-btn--sec {
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  border-color: var(--color-borde);
}

.cv-cupon-btn--sec:hover:not(:disabled) {
  color: var(--color-texto);
  background: var(--color-hover-neutro);
}

.cv-cupon-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

@keyframes cv-cupon-girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
