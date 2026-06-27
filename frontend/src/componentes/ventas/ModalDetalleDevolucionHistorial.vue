<script setup lang="ts">
import { CalendarClock, Eye, Package, RotateCcw, Tag, X } from 'lucide-vue-next';
import { formatearMoneda } from '../../utilidades/formatoMoneda';
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import ModalVistaCupon from './ModalVistaCupon.vue';
import {
  cuponesPorDevolucion,
  ventaCambioPorDevolucion,
} from '../../modulos/devoluciones/detalleDevolucionHistorial';
import { useEtiquetaFormaPago } from '../../composables/useEtiquetaFormaPago';
import { claseChipEstadoCupon, etiquetaEstadoCupon } from '../../datos/etiquetasEstadoCupon';
import { useCuponesDescuentoStore } from '../../stores/cuponesDescuento';
import { useVentasStore } from '../../stores/ventas';
import type { DevolucionRegistrada } from '../../tipos/devolucion';
import type { CuponDescuentoRegistrado } from '../../tipos/cuponDescuento';
import { etiquetaValorDescuentoCupon } from '../../tipos/cuponDescuento';
import {
  formatearFechaDiaMesAnio,
  formatearHoraAmPm,
} from '../../utilidades/formatoFechaHora';

const props = defineProps<{
  devolucion: DevolucionRegistrada;
}>();

const emit = defineEmits<{
  cerrar: [];
}>();

const etiquetaFormaPago = useEtiquetaFormaPago();

const refDialogo = useTemplateRef<HTMLDialogElement>('refDialogo');
const ventasStore = useVentasStore();
const cuponesStore = useCuponesDescuentoStore();
const { ventas } = storeToRefs(ventasStore);
const { cupones } = storeToRefs(cuponesStore);
const cuponAVer = ref<CuponDescuentoRegistrado | null>(null);

const ventaCambio = computed(() => ventaCambioPorDevolucion(props.devolucion, ventas.value));
const cuponesEmitidos = computed(() => cuponesPorDevolucion(props.devolucion.id, cupones.value));

const unidadesDevueltas = computed(() =>
  props.devolucion.lineas.reduce((acc, ln) => acc + ln.cantidad, 0),
);

onMounted(() => {
  refDialogo.value?.showModal();
});

function cerrarDialogo(): void {
  refDialogo.value?.close();
}

function alCerrarDialogo(): void {
  emit('cerrar');
}

function abrirVerCupon(cupon: CuponDescuentoRegistrado): void {
  cuponAVer.value = cupon;
}

function cerrarVerCupon(): void {
  cuponAVer.value = null;
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="refDialogo"
      class="lv-modal dev-modal-detalle"
      aria-labelledby="dev-detalle-titulo"
      @close="alCerrarDialogo"
    >
      <article class="lv-doc dev-doc-detalle" @click.stop>
        <header class="lv-doc-cab">
          <div class="lv-doc-cab-izq">
            <p class="lv-doc-tipo">Detalle de devolución</p>
            <h2 id="dev-detalle-titulo" class="lv-doc-num">{{ devolucion.numero }}</h2>
            <p class="lv-doc-fecha">
              <CalendarClock :size="15" stroke-width="2" class="lv-doc-fecha-ico" aria-hidden="true" />
              <time :datetime="devolucion.fecha">
                {{ formatearFechaDiaMesAnio(devolucion.fecha) }}
                <span class="lv-doc-fecha-sep">·</span>
                {{ formatearHoraAmPm(devolucion.fecha) }}
              </time>
            </p>
          </div>
          <button type="button" class="lv-doc-cerrar" aria-label="Cerrar detalle" @click="cerrarDialogo">
            <X :size="20" stroke-width="2" aria-hidden="true" />
          </button>
        </header>

        <div class="lv-doc-cuerpo">
          <section class="dev-det-meta" aria-label="Resumen de la devolución">
            <dl class="dev-det-meta-lista">
              <div class="dev-det-meta-item">
                <dt>Venta origen</dt>
                <dd><span class="lv-num">{{ devolucion.numeroVenta }}</span></dd>
              </div>
              <div class="dev-det-meta-item">
                <dt>Cliente</dt>
                <dd>{{ devolucion.nombreClienteMostrar || '—' }}</dd>
              </div>
              <div class="dev-det-meta-item">
                <dt>Total devuelto</dt>
                <dd class="lv-mono dev-det-total">{{ formatearMoneda(devolucion.total) }}</dd>
              </div>
              <div class="dev-det-meta-item">
                <dt>Prendas devueltas</dt>
                <dd class="lv-mono">{{ unidadesDevueltas }}</dd>
              </div>
            </dl>
          </section>

          <section class="lv-doc-items" aria-labelledby="dev-det-devueltas-tit">
            <h3 id="dev-det-devueltas-tit" class="lv-doc-items-tit">
              <RotateCcw :size="16" aria-hidden="true" />
              Prendas devueltas
            </h3>
            <ol class="dev-det-lineas" role="list">
              <li v-for="ln in devolucion.lineas" :key="ln.id" class="dev-det-linea">
                <div class="dev-det-linea-info">
                  <p class="dev-det-linea-nom">{{ ln.nombre }}</p>
                  <p class="dev-det-linea-meta lv-mono">
                    {{ ln.cantidad }} u. · {{ formatearMoneda(ln.precioUnitario) }} c/u
                  </p>
                </div>
                <strong class="dev-det-linea-sub lv-mono">{{ formatearMoneda(ln.subtotal) }}</strong>
              </li>
            </ol>
          </section>

          <section
            v-if="ventaCambio"
            class="lv-doc-items"
            aria-labelledby="dev-det-cambio-tit"
          >
            <h3 id="dev-det-cambio-tit" class="lv-doc-items-tit">
              <Package :size="16" aria-hidden="true" />
              Prendas entregadas en el cambio
            </h3>
            <p class="dev-det-sub">
              Venta <span class="lv-num">{{ ventaCambio.numero }}</span>
              · {{ etiquetaFormaPago(ventaCambio.formaPago) }}
              · Total {{ formatearMoneda(ventaCambio.total) }}
            </p>
            <ol class="dev-det-lineas" role="list">
              <li v-for="(ln, i) in ventaCambio.lineas" :key="`${ventaCambio.id}-${i}`" class="dev-det-linea">
                <div class="dev-det-linea-info">
                  <p class="dev-det-linea-nom">{{ ln.nombre }}</p>
                  <p class="dev-det-linea-meta lv-mono">
                    {{ ln.cantidad }} u. · {{ formatearMoneda(ln.precioUnitario) }} c/u
                  </p>
                </div>
                <strong class="dev-det-linea-sub lv-mono">{{ formatearMoneda(ln.subtotal) }}</strong>
              </li>
            </ol>
          </section>

          <section class="lv-doc-items" aria-labelledby="dev-det-cupones-tit">
            <h3 id="dev-det-cupones-tit" class="lv-doc-items-tit">
              <Tag :size="16" aria-hidden="true" />
              Cupones emitidos
            </h3>
            <ul v-if="cuponesEmitidos.length > 0" class="dev-det-cupones" role="list">
              <li v-for="cupon in cuponesEmitidos" :key="cupon.id" class="dev-det-cupon">
                <div class="dev-det-cupon-cab">
                  <span class="lv-num">{{ cupon.numero }}</span>
                  <span :class="claseChipEstadoCupon(cupon.estado, cupon)">
                    {{ etiquetaEstadoCupon(cupon.estado, cupon) }}
                  </span>
                </div>
                <p class="dev-det-cupon-valor">
                  Descuento: <strong>{{ etiquetaValorDescuentoCupon(cupon) }}</strong>
                </p>
                <p class="dev-det-cupon-meta lv-mono">
                  Vence el {{ formatearFechaDiaMesAnio(cupon.fechaVencimiento) }}
                  <template v-if="cupon.numeroVentaUsada">
                    · Usado en {{ cupon.numeroVentaUsada }}
                  </template>
                </p>
                <button type="button" class="dev-det-btn-cupon" @click="abrirVerCupon(cupon)">
                  <Eye :size="15" aria-hidden="true" />
                  Ver cupón
                </button>
              </li>
            </ul>
            <p v-else class="dev-det-vacio-inline">No se emitieron cupones por esta devolución.</p>
          </section>

          <section
            v-if="devolucion.observaciones.trim()"
            class="dev-det-obs"
            aria-labelledby="dev-det-obs-tit"
          >
            <h3 id="dev-det-obs-tit" class="dev-det-obs-tit">Observaciones</h3>
            <p class="dev-det-obs-txt">{{ devolucion.observaciones }}</p>
          </section>
        </div>

        <footer class="lv-doc-pie lv-doc-pie--centro">
          <button type="button" class="lv-doc-btn-cerrar lv-doc-btn-cerrar--accion" @click="cerrarDialogo">
            Cerrar
          </button>
        </footer>
      </article>
    </dialog>

    <ModalVistaCupon v-if="cuponAVer" :cupon="cuponAVer" @cerrar="cerrarVerCupon" />
  </Teleport>
</template>

<style scoped>
.dev-modal-detalle {
  width: min(44rem, calc(100vw - 1.25rem));
}

.dev-doc-detalle {
  max-height: min(92dvh, 52rem);
}

.dev-det-meta-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.65rem;
  margin: 0;
}

.dev-det-meta-item {
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.dev-det-meta-item dt {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.dev-det-meta-item dd {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  font-weight: 600;
}

.dev-det-total {
  color: var(--color-acento-hover);
}

.lv-doc-items-tit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.dev-det-sub {
  margin: 0 0 0.65rem;
  font-size: 0.84rem;
  color: var(--color-texto-suave);
}

.dev-det-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.dev-det-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.dev-det-linea-nom {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
}

.dev-det-linea-meta {
  margin: 0.18rem 0 0;
  font-size: 0.76rem;
  color: var(--color-texto-apagado);
}

.dev-det-linea-sub {
  font-size: 0.88rem;
  color: var(--color-acento-hover);
}

.dev-det-vacio-seccion,
.dev-det-vacio-inline {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px dashed var(--color-borde);
  background: var(--color-fondo-cabecera);
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
}

.dev-det-cupones {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dev-det-cupon {
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.dev-det-cupon-cab {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.dev-det-cupon-valor {
  margin: 0.35rem 0 0;
  font-size: 0.86rem;
  color: var(--color-texto-suave);
}

.dev-det-cupon-meta {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.dev-det-btn-cupon {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.55rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.dev-det-btn-cupon:hover {
  background: var(--color-hover-neutro);
}

.dev-det-obs-tit {
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.dev-det-obs-txt {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
  white-space: pre-wrap;
}

.lv-num {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: var(--color-acento-hover);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-acento-borde);
}

.lv-chip {
  display: inline-block;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.3;
  border: 1px solid transparent;
  white-space: nowrap;
}

.lv-mono {
  font-variant-numeric: tabular-nums;
}

.lv-modal {
  margin: auto;
  padding: 0;
  max-height: calc(100dvh - 1.5rem);
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--color-texto);
  overflow: visible;
}

.lv-modal::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(4px);
}

.lv-doc {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 1.5rem);
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.lv-doc-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.2rem 0.9rem;
  border-bottom: 3px double var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.lv-doc-tipo {
  margin: 0 0 0.25rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.lv-doc-num {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.lv-doc-fecha {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.lv-doc-fecha-ico {
  flex-shrink: 0;
  color: var(--color-texto-apagado);
}

.lv-doc-fecha-sep {
  opacity: 0.5;
}

.lv-doc-cerrar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto-apagado);
  cursor: pointer;
}

.lv-doc-cuerpo {
  flex: 1;
  overflow: auto;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lv-doc-items-tit {
  margin: 0 0 0.5rem;
  font-size: 0.92rem;
  font-weight: 650;
}

.lv-doc-pie {
  padding: 0.85rem 1.2rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.lv-doc-pie--centro {
  text-align: center;
}

.lv-doc-btn-cerrar {
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.lv-doc-btn-cerrar--accion {
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento);
  color: var(--color-texto-inverso, #fff);
}
</style>
