<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { etiquetaFormaPago } from '../../datos/formasPago';
import { useVentasStore } from '../../stores/ventas';
import PaginaNuevaVenta from './PaginaNuevaVenta.vue';
import type { VentaRegistrada } from '../../tipos/venta';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const ventasStore = useVentasStore();
const { ventas } = storeToRefs(ventasStore);

const busquedaCliente = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');

const refDetalle = useTemplateRef<HTMLDialogElement>('refDetalle');
const refNuevaVenta = useTemplateRef<HTMLDialogElement>('refNuevaVenta');
const ventaDetalle = ref<VentaRegistrada | null>(null);
const claveFormularioNueva = ref(0);
const modalNuevaVentaVisible = ref(false);

function ventaEnRangoFecha(v: VentaRegistrada): boolean {
  const ms = new Date(v.fecha).getTime();
  if (fechaDesde.value) {
    const t = new Date(`${fechaDesde.value}T00:00:00`).getTime();
    if (ms < t) return false;
  }
  if (fechaHasta.value) {
    const t = new Date(`${fechaHasta.value}T23:59:59.999`).getTime();
    if (ms > t) return false;
  }
  return true;
}

const ventasFiltradas = computed(() => {
  const q = busquedaCliente.value.trim().toLowerCase();
  return [...ventas.value]
    .filter((v) => ventaEnRangoFecha(v))
    .filter((v) => {
      if (!q) return true;
      return v.nombreClienteMostrar.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
});

function abrirDetalle(v: VentaRegistrada) {
  ventaDetalle.value = v;
  refDetalle.value?.showModal();
}

function cerrarDetalle() {
  refDetalle.value?.close();
  ventaDetalle.value = null;
}

function alCerrarDialogo() {
  ventaDetalle.value = null;
}

function limpiarFiltros() {
  busquedaCliente.value = '';
  fechaDesde.value = '';
  fechaHasta.value = '';
}

function abrirNuevaVenta() {
  claveFormularioNueva.value += 1;
  modalNuevaVentaVisible.value = true;
  nextTick(() => {
    refNuevaVenta.value?.showModal();
  });
}

function cerrarNuevaVenta() {
  refNuevaVenta.value?.close();
}

function alCerrarNuevaVenta() {
  modalNuevaVentaVisible.value = false;
}
</script>

<template>
  <section class="lv" aria-labelledby="titulo-ventas">
    <header class="lv-cab">
      <h1 id="titulo-ventas" class="lv-titulo">Ventas</h1>
    </header>

    <div class="lv-barra">
      <div class="lv-filtros">
        <label class="lv-etq" for="busq-cli">Buscar por cliente</label>
        <input
          id="busq-cli"
          v-model="busquedaCliente"
          type="search"
          class="lv-inp"
          placeholder="Nombre o texto del cliente…"
          autocomplete="off"
        />
      </div>
      <div class="lv-fechas">
        <div class="lv-fecha-cel">
          <label class="lv-etq" for="fd">Desde</label>
          <input id="fd" v-model="fechaDesde" type="date" class="lv-inp" />
        </div>
        <div class="lv-fecha-cel">
          <label class="lv-etq" for="fh">Hasta</label>
          <input id="fh" v-model="fechaHasta" type="date" class="lv-inp" />
        </div>
      </div>
      <div class="lv-acciones">
        <button type="button" class="lv-btn-sec" @click="limpiarFiltros">Limpiar filtros</button>
        <button type="button" class="lv-btn-nueva" @click="abrirNuevaVenta">Nueva venta</button>
      </div>
    </div>

    <div class="lv-tab-wrap" role="region" aria-label="Últimas ventas">
      <table class="lv-tabla">
        <thead>
          <tr>
            <th scope="col">Fecha / hora</th>
            <th scope="col">Número</th>
            <th scope="col">Cliente</th>
            <th scope="col">Condición</th>
            <th scope="col" class="lv-der">Total</th>
            <th scope="col" class="lv-col-acc" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in ventasFiltradas" :key="v.id">
            <td class="lv-mono">{{ formatearFechaYHora(v.fecha) }}</td>
            <td class="lv-mono">{{ v.numero }}</td>
            <td>{{ v.nombreClienteMostrar }}</td>
            <td>{{ etiquetaFormaPago(v.formaPago) }}</td>
            <td class="lv-der lv-mono">{{ formatoPeso.format(v.total) }}</td>
            <td class="lv-col-acc">
              <button type="button" class="lv-det" @click="abrirDetalle(v)">Detalle</button>
            </td>
          </tr>
          <tr v-if="ventasFiltradas.length === 0">
            <td colspan="6" class="lv-vacio">No hay ventas que coincidan con los filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <dialog
        ref="refNuevaVenta"
        class="lv-dlg-nueva"
        aria-label="Nueva venta"
        @close="alCerrarNuevaVenta"
      >
        <div v-if="modalNuevaVentaVisible" class="lv-dlg-nueva-shell">
          <div class="lv-dlg-nueva-caja">
            <PaginaNuevaVenta :key="claveFormularioNueva" @cerrar="cerrarNuevaVenta" />
          </div>
        </div>
      </dialog>
    </Teleport>

    <dialog
      ref="refDetalle"
      class="lv-modal"
      @close="alCerrarDialogo"
    >
      <div v-if="ventaDetalle" class="lv-modal-panel" @click.stop>
        <div class="lv-modal-cab">
          <h2 class="lv-modal-tit">Venta {{ ventaDetalle.numero }}</h2>
          <button type="button" class="lv-modal-x" aria-label="Cerrar" @click="cerrarDetalle">
            ×
          </button>
        </div>
        <p class="lv-modal-meta">
          <span>{{ formatearFechaYHora(ventaDetalle.fecha) }}</span>
          ·
          <span>{{ ventaDetalle.nombreClienteMostrar }}</span>
        </p>
        <p class="lv-modal-cond">
          <strong>Condición:</strong> {{ etiquetaFormaPago(ventaDetalle.formaPago) }}
        </p>
        <div class="lv-modal-tab-wrap">
          <table class="lv-modal-tab">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="lv-der">Cant.</th>
                <th class="lv-der">P. unit.</th>
                <th class="lv-der">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ln, i) in ventaDetalle.lineas" :key="i">
                <td>{{ ln.nombre }}</td>
                <td class="lv-der lv-mono">{{ ln.cantidad }}</td>
                <td class="lv-der lv-mono">{{ formatoPeso.format(ln.precioUnitario) }}</td>
                <td class="lv-der lv-mono">{{ formatoPeso.format(ln.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="lv-modal-total">
          <span>Total</span>
          <strong>{{ formatoPeso.format(ventaDetalle.total) }}</strong>
        </div>
        <p v-if="ventaDetalle.observaciones.trim()" class="lv-modal-obs">
          <strong>Observaciones:</strong> {{ ventaDetalle.observaciones }}
        </p>
        <button type="button" class="lv-modal-ok" @click="cerrarDetalle">Cerrar</button>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.lv {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 56rem;
  margin: 0 auto;
}

.lv-titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.lv-barra {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

@media (min-width: 720px) {
  .lv-barra {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .lv-filtros {
    flex: 1;
    min-width: 14rem;
  }

  .lv-fechas {
    display: flex;
    gap: 0.65rem;
  }

  .lv-acciones {
    margin-left: auto;
    flex-direction: row;
  }
}

.lv-etq {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.lv-inp {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9rem;
}

.lv-fecha-cel {
  min-width: 9.5rem;
}

.lv-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.lv-btn-sec {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.lv-btn-sec:hover {
  color: var(--color-texto);
  border-color: var(--color-texto-apagado);
}

.lv-btn-nueva {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento));
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(91, 110, 230, 0.35);
}

.lv-btn-nueva:hover {
  filter: brightness(1.06);
}

.lv-tab-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
}

.lv-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.lv-tabla th,
.lv-tabla td {
  padding: 0.55rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.lv-tabla thead th {
  font-weight: 600;
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lv-der {
  text-align: right;
}

.lv-mono {
  font-variant-numeric: tabular-nums;
}

.lv-col-acc {
  width: 1%;
  white-space: nowrap;
}

.lv-det {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
  cursor: pointer;
}

.lv-det:hover {
  border-color: var(--color-acento);
  background: var(--color-acento-suave);
}

.lv-vacio {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
}

.lv-modal {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: 26rem;
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.lv-modal::backdrop {
  background: rgba(0, 0, 0, 0.55);
}

.lv-modal-panel {
  padding: 1.1rem 1.2rem 1.2rem;
}

.lv-modal-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.lv-modal-tit {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.lv-modal-x {
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}

.lv-modal-x:hover {
  color: var(--color-texto);
}

.lv-modal-meta {
  margin: 0.35rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--color-texto-apagado);
}

.lv-modal-cond {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
}

.lv-modal-tab-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  margin-bottom: 0.75rem;
}

.lv-modal-tab {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.lv-modal-tab th,
.lv-modal-tab td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--color-borde);
}

.lv-modal-tab thead th {
  background: var(--color-fondo-cabecera);
  font-weight: 600;
  color: var(--color-texto-suave);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.lv-modal-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.65rem 0.75rem;
  margin-bottom: 0.65rem;
  border-radius: var(--radio-control);
  background: rgba(124, 140, 240, 0.1);
  border: 1px solid rgba(124, 140, 240, 0.28);
}

.lv-modal-total strong {
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
}

.lv-modal-obs {
  margin: 0 0 0.85rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.lv-modal-ok {
  width: 100%;
  padding: 0.6rem;
  border: none;
  border-radius: var(--radio-control);
  font-weight: 700;
  background: var(--color-borde);
  color: var(--color-texto);
  cursor: pointer;
}

.lv-modal-ok:hover {
  background: var(--color-texto-apagado);
}

.lv-dlg-nueva {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  z-index: 9000;
  width: 100vw;
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-texto);
  overflow: hidden;
}

.lv-dlg-nueva::backdrop {
  background: rgba(6, 10, 20, 0.72);
  backdrop-filter: blur(2px);
}

.lv-dlg-nueva-shell {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  width: 100%;
  padding: max(0.6rem, env(safe-area-inset-top, 0px))
    max(0.75rem, env(safe-area-inset-right, 0px))
    max(0.6rem, env(safe-area-inset-bottom, 0px))
    max(0.75rem, env(safe-area-inset-left, 0px));
}

.lv-dlg-nueva-caja {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(52rem, 100%);
  height: calc(100dvh - 1.25rem);
  max-height: calc(100dvh - 1.25rem);
  min-height: 0;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(124, 140, 240, 0.18);
  border-radius: 16px;
  background: linear-gradient(
    165deg,
    rgba(124, 140, 240, 0.07) 0%,
    var(--color-fondo-elevado) 48%
  );
  box-shadow:
    0 24px 56px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
</style>
