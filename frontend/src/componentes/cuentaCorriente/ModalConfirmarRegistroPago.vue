<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import { useTemplateRef } from 'vue';
import { formatearFechaDiaMesAnio } from '../../utilidades/formatoFechaHora';
import { formatearMoneda } from '../../utilidades/formatoMoneda';

export interface DatosConfirmacionRegistroPago {
  nombreTercero: string;
  documentoTercero: string;
  importe: number;
  fechaIso: string;
  formaPago: string;
  concepto: string;
}

const props = defineProps<{
  etiquetaTercero: 'cliente' | 'proveedor';
  datos: DatosConfirmacionRegistroPago | null;
  registrando?: boolean;
}>();

const emit = defineEmits<{
  confirmar: [];
  cancelar: [];
}>();

const refDialogo = useTemplateRef<HTMLDialogElement>('refDialogo');

function abrir(): void {
  refDialogo.value?.showModal();
}

function cerrar(): void {
  refDialogo.value?.close();
}

function alCerrarDialogo(): void {
  emit('cancelar');
}

function cancelar(): void {
  cerrar();
}

function confirmar(): void {
  if (props.registrando || !props.datos) return;
  emit('confirmar');
}

defineExpose({ abrir, cerrar });
</script>

<template>
  <dialog
    ref="refDialogo"
    class="cc-conf-pago"
    :aria-labelledby="datos ? 'cc-conf-pago-titulo' : undefined"
    aria-modal="true"
    @close="alCerrarDialogo"
  >
    <article v-if="datos" class="cc-conf-pago-panel" @click.stop>
      <header class="cc-conf-pago-cab">
        <div class="cc-conf-pago-ico" aria-hidden="true">
          <AlertTriangle :size="22" stroke-width="2" />
        </div>
        <div class="cc-conf-pago-cab-txt">
          <p class="cc-conf-pago-etiq">Confirmar registro</p>
          <h2 id="cc-conf-pago-titulo" class="cc-conf-pago-tit">¿Registrar este pago?</h2>
          <p class="cc-conf-pago-desc">
            Vas a registrar un ingreso en la cuenta corriente del {{ etiquetaTercero }}. Revisá los datos
            antes de continuar.
          </p>
        </div>
      </header>

      <div class="cc-conf-pago-resumen" role="group" aria-label="Resumen del pago a registrar">
        <div class="cc-conf-pago-fila">
          <span class="cc-conf-pago-lab">{{ etiquetaTercero === 'cliente' ? 'Cliente' : 'Proveedor' }}</span>
          <span class="cc-conf-pago-val">
            {{ datos.nombreTercero }}
            <span class="cc-conf-pago-doc">{{ datos.documentoTercero }}</span>
          </span>
        </div>
        <div class="cc-conf-pago-fila cc-conf-pago-fila--destacada">
          <span class="cc-conf-pago-lab">Importe</span>
          <strong class="cc-conf-pago-importe">{{ formatearMoneda(datos.importe) }}</strong>
        </div>
        <div class="cc-conf-pago-fila">
          <span class="cc-conf-pago-lab">Fecha contable</span>
          <span class="cc-conf-pago-val">{{ formatearFechaDiaMesAnio(datos.fechaIso) }}</span>
        </div>
        <div class="cc-conf-pago-fila">
          <span class="cc-conf-pago-lab">Forma de pago</span>
          <span class="cc-conf-pago-val">{{ datos.formaPago }}</span>
        </div>
        <div v-if="datos.concepto" class="cc-conf-pago-fila">
          <span class="cc-conf-pago-lab">Concepto</span>
          <span class="cc-conf-pago-val">{{ datos.concepto }}</span>
        </div>
      </div>

      <p class="cc-conf-pago-aviso" role="note">
        Al confirmar, el pago quedará registrado y se abrirá el recibo. Esta acción no se puede deshacer
        desde esta pantalla.
      </p>

      <footer class="cc-conf-pago-pie">
        <button type="button" class="cc-conf-pago-btn cc-conf-pago-btn--sec" :disabled="registrando" @click="cancelar">
          Volver al formulario
        </button>
        <button
          type="button"
          class="cc-conf-pago-btn cc-conf-pago-btn--pri"
          :disabled="registrando"
          :aria-busy="registrando"
          @click="confirmar"
        >
          {{ registrando ? 'Registrando…' : 'Sí, registrar pago' }}
        </button>
      </footer>
    </article>
  </dialog>
</template>

<style scoped>
.cc-conf-pago {
  margin: auto;
  padding: 0;
  width: min(28rem, calc(100vw - 1.25rem));
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--color-texto);
}

.cc-conf-pago::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(4px);
}

.cc-conf-pago-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.cc-conf-pago-cab {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 1.15rem 1.25rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cc-conf-pago-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-advertencia) 16%, transparent);
  color: var(--color-advertencia);
}

.cc-conf-pago-etiq {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.cc-conf-pago-tit {
  margin: 0.2rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.cc-conf-pago-desc {
  margin: 0.35rem 0 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.cc-conf-pago-resumen {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1rem 1.25rem;
}

.cc-conf-pago-fila {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.86rem;
}

.cc-conf-pago-fila--destacada {
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  background: var(--color-fondo-cabecera);
  border: 1px solid var(--color-borde);
}

.cc-conf-pago-lab {
  flex-shrink: 0;
  color: var(--color-texto-apagado);
  font-weight: 600;
}

.cc-conf-pago-val {
  text-align: right;
  min-width: 0;
}

.cc-conf-pago-doc {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.8rem;
  color: var(--color-texto-apagado);
  font-variant-numeric: tabular-nums;
}

.cc-conf-pago-importe {
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-acento-intenso);
}

.cc-conf-pago-aviso {
  margin: 0;
  padding: 0 1.25rem 1rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.cc-conf-pago-pie {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem 1.1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cc-conf-pago-btn {
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  padding: 0.52rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.cc-conf-pago-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cc-conf-pago-btn--sec {
  background: transparent;
  color: var(--color-texto);
}

.cc-conf-pago-btn--pri {
  background: linear-gradient(165deg, var(--color-acento-intenso), var(--color-acento));
  border-color: var(--color-acento-borde);
  color: var(--color-texto-sobre-acento);
}

.cc-conf-pago-btn--pri:hover:not(:disabled) {
  filter: brightness(1.06);
}
</style>
