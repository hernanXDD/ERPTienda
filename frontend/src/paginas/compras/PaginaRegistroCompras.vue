<script setup lang="ts">
import { ClipboardList } from 'lucide-vue-next';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import { etiquetaCondicionCompra } from '../../datos/condicionesCompra';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import type { CompraRegistrada } from '../../tipos/compraRegistrada';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import FormularioNuevaCompra from './FormularioNuevaCompra.vue';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('compras-registro');

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const registroStore = useRegistroComprasStore();
const { compras } = storeToRefs(registroStore);
const { tienePermiso } = usePermisosOperador();
const puedeRegistrarCompras = computed(() => tienePermiso('puedeRegistrarCompras'));

const busquedaProveedor = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');

const refDetalleCompra = useTemplateRef<HTMLDialogElement>('refDetalleCompra');
const refNuevaCompra = useTemplateRef<HTMLDialogElement>('refNuevaCompra');

const compraDetalleSeleccionada = ref<CompraRegistrada | null>(null);
const claveFormularioNuevaCompra = ref(0);
const modalRegistrarCompraVisible = ref(false);

function compraDentroDeRangoFechas(compra: CompraRegistrada): boolean {
  const milisegundos = new Date(compra.fecha).getTime();
  if (fechaDesde.value) {
    const inicio = new Date(`${fechaDesde.value}T00:00:00`).getTime();
    if (milisegundos < inicio) return false;
  }
  if (fechaHasta.value) {
    const fin = new Date(`${fechaHasta.value}T23:59:59.999`).getTime();
    if (milisegundos > fin) return false;
  }
  return true;
}

const comprasFiltradas = computed(() => {
  const consulta = busquedaProveedor.value.trim().toLowerCase();
  return [...compras.value]
    .filter(compraDentroDeRangoFechas)
    .filter((compra) => {
      if (!consulta) return true;
      return compra.nombreProveedorMostrar.toLowerCase().includes(consulta);
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
});

function abrirDetalleCompra(compra: CompraRegistrada) {
  compraDetalleSeleccionada.value = compra;
  refDetalleCompra.value?.showModal();
}

function cerrarDetalleCompra() {
  refDetalleCompra.value?.close();
}

function alCerrarDialogoDetalle() {
  compraDetalleSeleccionada.value = null;
}

function limpiarFiltros() {
  busquedaProveedor.value = '';
  fechaDesde.value = '';
  fechaHasta.value = '';
}

function abrirRegistrarCompra() {
  claveFormularioNuevaCompra.value += 1;
  modalRegistrarCompraVisible.value = true;
  nextTick(() => {
    refNuevaCompra.value?.showModal();
  });
}

function cerrarRegistrarCompra() {
  refNuevaCompra.value?.close();
}

function alCerrarDialogoRegistrar() {
  modalRegistrarCompraVisible.value = false;
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="tit-reg-comp">
    <div class="pg-marco">
    <header class="pg-cab">
      <div class="pg-cab-txt">
        <div class="pg-cab-izq">
          <ClipboardList :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
          <div>
            <p class="pg-eyebrow">Compras · Registro</p>
            <h1 id="tit-reg-comp" class="pg-titulo">Registro de compras</h1>
            <p class="pg-sub">{{ descripcionPagina }}</p>
          </div>
        </div>
      </div>
    </header>

    <p v-if="!puedeRegistrarCompras" class="rcp-banner-lectura" role="status">
      Tenés acceso de lectura. Para registrar compras necesitás el permiso correspondiente en tu usuario.
    </p>

    <div class="pg-barra">
      <div class="rcp-busq-wrap">
        <label class="pg-filtro-etiq" for="rcp-busq-proveedor">Buscar proveedor</label>
        <input
          id="rcp-busq-proveedor"
          v-model="busquedaProveedor"
          type="search"
          class="pg-filtro-inp"
          placeholder="Nombre del proveedor…"
          autocomplete="off"
        />
      </div>
      <div class="rcp-fechas">
        <div class="rcp-fecha-item">
          <label class="pg-filtro-etiq" for="rcp-desde">Desde</label>
          <input id="rcp-desde" v-model="fechaDesde" type="date" class="pg-filtro-inp" />
        </div>
        <div class="rcp-fecha-item">
          <label class="pg-filtro-etiq" for="rcp-hasta">Hasta</label>
          <input id="rcp-hasta" v-model="fechaHasta" type="date" class="pg-filtro-inp" />
        </div>
      </div>
      <div class="rcp-acciones">
        <button type="button" class="rcp-btn-sec" @click="limpiarFiltros">Limpiar filtros</button>
        <button
          v-if="puedeRegistrarCompras"
          type="button"
          class="rcp-btn-pri"
          @click="abrirRegistrarCompra"
        >
          Registrar compra
        </button>
      </div>
    </div>

    <div class="pg-tabla-cuerpo" role="region" aria-label="Historial de compras">
      <table class="pg-tabla pg-tabla--estado">
        <thead>
          <tr>
            <th scope="col">Fecha / hora</th>
            <th scope="col">Número</th>
            <th scope="col">Proveedor</th>
            <th scope="col">Condición</th>
            <th scope="col" class="rcp-der">Total</th>
            <th scope="col" class="rcp-col-acc" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="compra in comprasFiltradas" :key="compra.id">
            <td class="rcp-mono">{{ formatearFechaYHora(compra.fecha) }}</td>
            <td class="rcp-mono">{{ compra.numero }}</td>
            <td>{{ compra.nombreProveedorMostrar }}</td>
            <td>{{ etiquetaCondicionCompra(compra.condicionCompra) }}</td>
            <td class="rcp-der rcp-mono">{{ formatoPeso.format(compra.total) }}</td>
            <td class="rcp-col-acc">
              <button type="button" class="rcp-det" @click="abrirDetalleCompra(compra)">
                Ver detalle
              </button>
            </td>
          </tr>
          <tr v-if="comprasFiltradas.length === 0">
            <td colspan="6" class="rcp-vacio">No hay compras que coincidan con los filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>

    </div>

    <Teleport to="body">
      <dialog
        ref="refNuevaCompra"
        class="rcp-dlg-overlay"
        aria-labelledby="titulo-dlg-registrar-compra"
        @close="alCerrarDialogoRegistrar"
      >
        <div v-if="modalRegistrarCompraVisible" class="rcp-dlg-caja">
          <FormularioNuevaCompra :key="claveFormularioNuevaCompra" @cerrar="cerrarRegistrarCompra" />
        </div>
      </dialog>
    </Teleport>

    <dialog ref="refDetalleCompra" class="rcp-modal" @close="alCerrarDialogoDetalle">
      <div v-if="compraDetalleSeleccionada" class="rcp-modal-panel" @click.stop>
        <div class="rcp-modal-cab">
          <h2 class="rcp-modal-tit">{{ compraDetalleSeleccionada.numero }}</h2>
          <button type="button" class="rcp-modal-x" aria-label="Cerrar" @click="cerrarDetalleCompra">
            ×
          </button>
        </div>
        <p class="rcp-modal-meta">
          <span>{{ formatearFechaYHora(compraDetalleSeleccionada.fecha) }}</span>
          ·
          <span>{{ compraDetalleSeleccionada.nombreProveedorMostrar }}</span>
        </p>
        <p class="rcp-modal-condicion">
          <strong>Condición:</strong>
          {{ etiquetaCondicionCompra(compraDetalleSeleccionada.condicionCompra) }}
        </p>
        <div class="rcp-modal-tab-wrap">
          <table class="rcp-modal-tabla">
            <thead>
              <tr>
                <th scope="col">Ítem</th>
                <th class="rcp-der" scope="col">Cant.</th>
                <th class="rcp-der" scope="col">C. unit.</th>
                <th class="rcp-der" scope="col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ln, indiceLinea) in compraDetalleSeleccionada.lineas" :key="indiceLinea">
                <td>{{ ln.nombre }}</td>
                <td class="rcp-der rcp-mono">{{ ln.cantidad }}</td>
                <td class="rcp-der rcp-mono">{{ formatoPeso.format(ln.costoUnitario) }}</td>
                <td class="rcp-der rcp-mono">{{ formatoPeso.format(ln.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rcp-modal-total">
          <span>Total</span>
          <strong>{{ formatoPeso.format(compraDetalleSeleccionada.total) }}</strong>
        </div>
        <p v-if="compraDetalleSeleccionada.observaciones.trim()" class="rcp-modal-obs">
          <strong>Observaciones:</strong>
          {{ compraDetalleSeleccionada.observaciones }}
        </p>
        <button type="button" class="rcp-modal-ok" @click="cerrarDetalleCompra">Cerrar</button>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.rcp {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 56rem;
  margin: 0 auto;
}

.pg-titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.pg-sub {
  margin: 0.45rem 0 0;
  font-size: 0.84rem;
  line-height: 1.53;
  color: var(--color-texto-apagado);
}

.pg-barra {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

@media (min-width: 720px) {
  .pg-barra {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .rcp-busq-wrap {
    flex: 1;
    min-width: 14rem;
  }

  .rcp-fechas {
    display: flex;
    gap: 0.65rem;
  }

  .rcp-acciones {
    margin-inline-start: auto;
    flex-direction: row;
  }
}

.pg-filtro-etiq {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.pg-filtro-inp {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9rem;
}

.rcp-fecha-item {
  min-width: 9.5rem;
}

.rcp-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.rcp-btn-sec {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.rcp-btn-sec:hover {
  color: var(--color-texto);
  border-color: var(--color-texto-apagado);
}

.rcp-btn-pri {
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
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(91, 110, 230, 0.35);
}

.rcp-btn-pri:hover {
  filter: brightness(1.06);
}

.pg-tabla-cuerpo {
  overflow-x: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
}

.pg-tabla pg-tabla--estado {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.pg-tabla pg-tabla--estado th,
.pg-tabla pg-tabla--estado td {
  padding: 0.55rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.pg-tabla pg-tabla--estado thead th {
  font-weight: 600;
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rcp-der {
  text-align: right;
}

.rcp-mono {
  font-variant-numeric: tabular-nums;
}

.rcp-col-acc {
  width: 1%;
  white-space: nowrap;
}

.rcp-det {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
  cursor: pointer;
}

.rcp-det:hover {
  border-color: var(--color-acento);
  background: var(--color-acento-suave);
}

.rcp-vacio {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
}

.rcp-modal {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(30rem, 100%);
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.rcp-modal::backdrop {
  background: rgba(0, 0, 0, 0.55);
}

.rcp-modal-panel {
  padding: 1.1rem 1.2rem 1.2rem;
}

.rcp-modal-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.rcp-modal-tit {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.rcp-modal-x {
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}

.rcp-modal-meta {
  margin: 0.35rem 0 0.4rem;
  font-size: 0.85rem;
  color: var(--color-texto-apagado);
}

.rcp-modal-condicion {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
}

.rcp-modal-tab-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  margin-bottom: 0.75rem;
}

.rcp-modal-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.rcp-modal-tabla th,
.rcp-modal-tabla td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--color-borde);
}

.rcp-modal-tabla thead th {
  background: var(--color-fondo-cabecera);
  font-weight: 600;
  color: var(--color-texto-suave);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.rcp-modal-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.65rem 0.75rem;
  margin-bottom: 0.65rem;
  border-radius: var(--radio-control);
  background: rgba(124, 140, 240, 0.1);
  border: 1px solid rgba(124, 140, 240, 0.28);
}

.rcp-modal-total strong {
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
}

.rcp-modal-obs {
  margin: 0 0 0.85rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.rcp-modal-ok {
  width: 100%;
  padding: 0.6rem;
  border: none;
  border-radius: var(--radio-control);
  font-weight: 700;
  background: var(--color-borde);
  color: var(--color-texto);
  cursor: pointer;
}

.rcp-banner-lectura {
  margin: 0 0 1rem;
  padding: 0.65rem 0.82rem;
  border-radius: 10px;
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.06);
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.rcp-modal-ok:hover {
  background: var(--color-texto-apagado);
}

.rcp-dlg-overlay {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(36rem, 100%);
  max-height: min(92dvh, 44rem);
  border: 1px solid var(--color-borde);
  border-radius: 16px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.rcp-dlg-overlay::backdrop {
  background: rgba(6, 10, 20, 0.72);
  backdrop-filter: blur(2px);
}

.rcp-dlg-caja {
  max-height: min(92dvh, 44rem);
  overflow: auto;
}

@media (max-width: 480px) {
  .rcp-dlg-overlay {
    width: calc(100vw - 1rem);
    max-height: 95dvh;
  }
}
</style>
