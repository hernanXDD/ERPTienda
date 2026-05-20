<script setup lang="ts">
import {
  CalendarClock,
  CreditCard,
  FileText,
  History,
  Package,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-vue-next';
import { computed, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { etiquetaFormaPago } from '../../datos/formasPago';
import { useVentasStore } from '../../stores/ventas';
import type { IdFormaPago, VentaRegistrada } from '../../tipos/venta';
import {
  formatearFechaDiaMesAnio,
  formatearHoraAmPm,
} from '../../utilidades/formatoFechaHora';

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
const ventaDetalle = ref<VentaRegistrada | null>(null);

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

const totalFiltrado = computed(() =>
  ventasFiltradas.value.reduce((acum, v) => acum + v.total, 0),
);

const hayFiltrosActivos = computed(
  () => Boolean(busquedaCliente.value.trim() || fechaDesde.value || fechaHasta.value),
);

const cantidadUnidadesDetalle = computed(() => {
  if (!ventaDetalle.value) return 0;
  return ventaDetalle.value.lineas.reduce((acum, ln) => acum + ln.cantidad, 0);
});

function claseChipPago(id: IdFormaPago): string {
  return `lv-chip lv-chip--${id.toLowerCase().replace(/_/g, '-')}`;
}

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
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-historial-ventas">
    <div class="pg-marco">
<header class="pg-cab">
      <div class="pg-cab-txt">
        <div class="pg-cab-izq">
        <History :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
        <div>
          <h1 id="titulo-historial-ventas" class="pg-titulo">Historial de ventas</h1>
          <p class="pg-sub">
            Consultá ventas registradas, filtrá por cliente o rango de fechas y revisá el detalle de
            cada operación.
          </p>
        </div>
      </div>
          </div>
    </header>

    <div class="pg-barra">
      <div class="pg-barra-col pg-barra-col--busq">
        <label class="pg-filtro-bl" for="busq-cli">
          <span class="pg-filtro-etiq">Buscar por cliente</span>
          <input
            id="busq-cli"
            v-model="busquedaCliente"
            type="search"
            class="pg-filtro-inp"
            placeholder="Nombre o texto del cliente…"
            autocomplete="off"
          />
        </label>
      </div>

      <div class="pg-barra-col pg-barra-col--fecha">
        <label class="pg-filtro-bl" for="fd">
          <span class="pg-filtro-etiq">Fecha desde</span>
          <input id="fd" v-model="fechaDesde" type="date" class="pg-filtro-inp" />
        </label>
      </div>

      <div class="pg-barra-col pg-barra-col--fecha">
        <label class="pg-filtro-bl" for="fh">
          <span class="pg-filtro-etiq">Fecha hasta</span>
          <input id="fh" v-model="fechaHasta" type="date" class="pg-filtro-inp" />
        </label>
      </div>

      <div class="pg-barra-col pg-barra-col--reinicio">
        <div class="pg-filtro-bl">
          <span class="pg-filtro-etiq">Reinicio</span>
          <button
            type="button"
            class="pg-btn-reset-filtros"
            :disabled="!hayFiltrosActivos"
            @click="limpiarFiltros"
          >
            <RefreshCw :size="16" aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <p class="pg-resumen pg-resumen--flex" role="status">
      <span>
        Mostrando <strong>{{ ventasFiltradas.length }}</strong> de
        {{ ventas.length }} ventas
      </span>
      <span v-if="ventasFiltradas.length" class="lv-resumen-total">
        Total filtrado: <strong>{{ formatoPeso.format(totalFiltrado) }}</strong>
      </span>
    </p>

    <div class="pg-tabla-cuerpo" role="region" aria-label="Listado de ventas">
      <div class="pg-tabla-scroll pg-tabla-scroll--libre"><table class="pg-tabla pg-tabla--estado">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Número</th>
            <th scope="col">Cliente</th>
            <th scope="col">Condición</th>
            <th scope="col" class="pg-der">Total</th>
            <th scope="col" class="lv-col-acc">
              <span class="pg-sr">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in ventasFiltradas"
            :key="v.id"
            class="lv-fila"
            tabindex="0"
            @click="abrirDetalle(v)"
            @keydown.enter.prevent="abrirDetalle(v)"
          >
            <td class="lv-cel-fecha">
              <span class="lv-fecha-dia">{{ formatearFechaDiaMesAnio(v.fecha) }}</span>
              <span class="lv-fecha-hora">{{ formatearHoraAmPm(v.fecha) }}</span>
            </td>
            <td>
              <span class="lv-num">{{ v.numero }}</span>
            </td>
            <td>
              <span
                class="lv-cli"
                :class="{ 'lv-cli--cf': !v.clienteId }"
              >
                {{ v.nombreClienteMostrar }}
              </span>
            </td>
            <td>
              <span :class="claseChipPago(v.formaPago)">
                {{ etiquetaFormaPago(v.formaPago) }}
              </span>
            </td>
            <td class="lv-der lv-mono lv-cel-total">{{ formatoPeso.format(v.total) }}</td>
            <td class="lv-col-acc">
              <button
                type="button"
                class="lv-det"
                :aria-label="`Ver detalle de venta ${v.numero}`"
                @click.stop="abrirDetalle(v)"
              >
                <FileText :size="15" stroke-width="2" aria-hidden="true" />
                Detalle
              </button>
            </td>
          </tr>
          <tr v-if="ventasFiltradas.length === 0">
            <td colspan="6" class="pg-vacio">
              <template v-if="ventas.length === 0">
                Todavía no hay ventas registradas en esta sesión. Las operaciones confirmadas en el
                centro de ventas aparecerán aquí.
              </template>
              <template v-else>
                No hay ventas que coincidan con los filtros elegidos. Probá ampliar el rango de
                fechas o limpiar la búsqueda.
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
    </div>

    <dialog
      ref="refDetalle"
      class="lv-modal"
      aria-labelledby="lv-detalle-titulo"
      @close="alCerrarDialogo"
    >
      <article v-if="ventaDetalle" class="lv-doc" @click.stop>
        <header class="lv-doc-cab">
          <div class="lv-doc-cab-izq">
            <p class="lv-doc-tipo">Comprobante interno</p>
            <h2 id="lv-detalle-titulo" class="lv-doc-num">{{ ventaDetalle.numero }}</h2>
            <p class="lv-doc-fecha">
              <CalendarClock :size="15" stroke-width="2" class="lv-doc-fecha-ico" aria-hidden="true" />
              <time :datetime="ventaDetalle.fecha">
                {{ formatearFechaDiaMesAnio(ventaDetalle.fecha) }}
                <span class="lv-doc-fecha-sep">·</span>
                {{ formatearHoraAmPm(ventaDetalle.fecha) }}
              </time>
            </p>
          </div>
          <button type="button" class="lv-doc-cerrar" aria-label="Cerrar detalle" @click="cerrarDetalle">
            <X :size="20" stroke-width="2" aria-hidden="true" />
          </button>
        </header>

        <div class="lv-doc-cuerpo">
          <section class="lv-doc-meta" aria-label="Datos de la venta">
            <div class="lv-doc-tarjeta">
              <span class="lv-doc-tarjeta-ico" aria-hidden="true">
                <UserRound :size="18" stroke-width="2" />
              </span>
              <div class="lv-doc-tarjeta-txt">
                <span class="lv-doc-tarjeta-etiq">Cliente</span>
                <span
                  class="lv-doc-tarjeta-val"
                  :class="{ 'lv-doc-tarjeta-val--cf': !ventaDetalle.clienteId }"
                >
                  {{ ventaDetalle.nombreClienteMostrar }}
                </span>
              </div>
            </div>

            <div class="lv-doc-tarjeta">
              <span class="lv-doc-tarjeta-ico" aria-hidden="true">
                <CreditCard :size="18" stroke-width="2" />
              </span>
              <div class="lv-doc-tarjeta-txt">
                <span class="lv-doc-tarjeta-etiq">Forma de pago</span>
                <span :class="claseChipPago(ventaDetalle.formaPago)">
                  {{ etiquetaFormaPago(ventaDetalle.formaPago) }}
                </span>
              </div>
            </div>
          </section>

          <section class="lv-doc-items" aria-labelledby="lv-detalle-items-tit">
            <div class="lv-doc-items-cab">
              <h3 id="lv-detalle-items-tit" class="lv-doc-items-tit">
                <Package :size="17" stroke-width="2" class="lv-doc-items-ico" aria-hidden="true" />
                Detalle de ítems
              </h3>
              <p class="lv-doc-items-res">
                {{ ventaDetalle.lineas.length }}
                {{ ventaDetalle.lineas.length === 1 ? 'artículo' : 'artículos' }}
                ·
                {{ cantidadUnidadesDetalle }}
                {{ cantidadUnidadesDetalle === 1 ? 'unidad' : 'unidades' }}
              </p>
            </div>

            <ol class="lv-lineas" role="list">
              <li
                v-for="(ln, i) in ventaDetalle.lineas"
                :key="`${ventaDetalle.id}-${i}`"
                class="lv-linea"
              >
                <div class="lv-linea-fila">
                  <span class="lv-linea-idx" aria-hidden="true">{{ i + 1 }}</span>
                  <div class="lv-linea-cuerpo">
                    <p class="lv-linea-nom">{{ ln.nombre }}</p>
                    <p class="lv-linea-calc lv-mono">
                      <span class="lv-linea-cant">{{ ln.cantidad }}</span>
                      <span class="lv-linea-x" aria-hidden="true">×</span>
                      <span>{{ formatoPeso.format(ln.precioUnitario) }}</span>
                      <span class="lv-linea-igual" aria-hidden="true">=</span>
                    </p>
                  </div>
                  <p class="lv-linea-importe lv-mono">{{ formatoPeso.format(ln.subtotal) }}</p>
                </div>
              </li>
            </ol>
          </section>

          <section
            v-if="ventaDetalle.observaciones.trim()"
            class="lv-doc-obs"
            aria-label="Observaciones"
          >
            <span class="lv-doc-obs-etiq">Observaciones</span>
            <p class="lv-doc-obs-txt">{{ ventaDetalle.observaciones }}</p>
          </section>

          <aside class="lv-doc-totales" aria-label="Resumen de importes">
            <div class="lv-doc-totales-fila">
              <span>Subtotal ítems</span>
              <span class="lv-mono">{{ formatoPeso.format(ventaDetalle.total) }}</span>
            </div>
            <div class="lv-doc-totales-fila lv-doc-totales-fila--final">
              <span>Total de la venta</span>
              <strong class="lv-mono">{{ formatoPeso.format(ventaDetalle.total) }}</strong>
            </div>
          </aside>
        </div>

        <footer class="lv-doc-pie">
          <p class="lv-doc-leyenda">Documento interno — no válido como comprobante fiscal</p>
          <button type="button" class="lv-doc-btn-cerrar" @click="cerrarDetalle">Cerrar</button>
        </footer>
      </article>
    </dialog>
  </section>
</template>

<style scoped>
.lv {
  width: 100%;
  max-width: 1120px;
  margin-inline: auto;
}

.lv-cab {
  margin-bottom: 1rem;
}

.lv-cab-izq {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.lv-ico {
  flex-shrink: 0;
  color: var(--color-acento);
  margin-top: 0.1rem;
}

.lv-titulo {
  margin: 0;
  font-size: clamp(1.1rem, 2.6vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.lv-sub {
  margin: 0.35rem 0 0;
  font-size: 0.845rem;
  line-height: 1.52;
  color: var(--color-texto-apagado);
  max-width: 58rem;
}

.lv-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.75rem 1.15rem;
  margin-bottom: 0.65rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: var(--sombra-suave);
}

.pg-barra-col {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.pg-barra-col--busq {
  flex: 1 1 13rem;
  min-width: min(100%, 12rem);
}

.pg-barra-col--fecha {
  flex: 0 1 10.25rem;
  min-width: min(100%, 9.5rem);
}

.pg-barra-col--reinicio {
  flex: 0 0 auto;
  margin-left: auto;
}

.pg-barra-col--reinicio .lv-btn-reset {
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .pg-barra-col--reinicio .lv-btn-reset {
    width: auto;
    min-width: 10.5rem;
  }
}

@media (max-width: 719px) {
  .pg-barra-col--reinicio {
    margin-left: 0;
    flex: 1 1 100%;
  }
}

.lv-etq-bl {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.lv-etiqueta {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.lv-inp {
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  padding: 0.42rem 0.62rem;
  min-height: 2.38rem;
  box-sizing: border-box;
  width: 100%;
}

.lv-inp:focus-visible {
  border-color: var(--color-acento-borde);
}

.lv-btn-sec {
  cursor: pointer;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.45rem 0.92rem;
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
  white-space: nowrap;
  gap: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.38rem;
  box-sizing: border-box;
  padding-inline: 0.85rem;
}

.lv-btn-sec:hover:not(:disabled) {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.lv-btn-sec:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.lv-resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.lv-resumen strong {
  color: var(--color-texto);
  font-weight: 700;
}

.lv-resumen-total strong {
  color: var(--color-acento-hover);
}

.lv-tab-wrap {
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  overflow-x: auto;
  background: var(--color-fondo-elevado);
  box-shadow: var(--sombra-suave);
}

.lv-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.825rem;
  min-width: 680px;
}

.lv-tabla th,
.lv-tabla td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid var(--color-borde);
  text-align: left;
  vertical-align: middle;
}

.lv-tabla thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.695rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-cabecera);
  white-space: nowrap;
}

.lv-tabla tbody tr:last-child td {
  border-bottom: none;
}

.lv-fila {
  cursor: pointer;
  transition: background 0.12s ease;
}

.lv-fila:hover,
.lv-fila:focus-visible {
  background: rgba(124, 140, 240, 0.07);
  outline: none;
}

.lv-cel-fecha {
  white-space: nowrap;
}

.lv-fecha-dia {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.lv-fecha-hora {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
  font-variant-numeric: tabular-nums;
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
  border: 1px solid rgba(124, 140, 240, 0.22);
}

.lv-cli {
  font-weight: 500;
}

.lv-cli--cf {
  color: var(--color-texto-suave);
  font-style: italic;
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

.lv-chip--efectivo {
  color: #86efac;
  background: rgba(74, 222, 128, 0.12);
  border-color: rgba(74, 222, 128, 0.28);
}

.lv-chip--debito,
.lv-chip--credito {
  color: #a5b4fc;
  background: rgba(124, 140, 240, 0.14);
  border-color: rgba(124, 140, 240, 0.32);
}

.lv-chip--transferencia {
  color: #c4b5fd;
  background: rgba(167, 139, 250, 0.12);
  border-color: rgba(167, 139, 250, 0.3);
}

.lv-chip--cuenta-corriente {
  color: #fcd34d;
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.28);
}

.lv-der {
  text-align: right;
}

.lv-mono {
  font-variant-numeric: tabular-nums;
}

.lv-cel-total {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--color-texto);
}

.lv-col-acc {
  width: 1%;
  white-space: nowrap;
}

.lv-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.lv-det {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
  cursor: pointer;
}

.lv-det:hover {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.lv-vacio {
  padding: 2rem 1rem !important;
  text-align: center !important;
  color: var(--color-texto-apagado);
  border-bottom: none !important;
  line-height: 1.5;
  max-width: 42rem;
  margin-inline: auto;
}

/* Modal detalle — vista comprobante */
.lv-modal {
  margin: auto;
  padding: 0;
  width: min(40rem, calc(100vw - 1.25rem));
  max-height: calc(100dvh - 1.5rem);
  border: 1px solid var(--color-borde);
  border-radius: 16px;
  background: transparent;
  color: var(--color-texto);
  overflow: visible;
}

.lv-modal::backdrop {
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.lv-doc {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 1.5rem);
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-fondo-elevado);
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.55);
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
  font-variant-numeric: tabular-nums;
  color: var(--color-acento-hover);
}

.lv-doc-fecha {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.4rem 0 0;
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.lv-doc-fecha-ico {
  flex-shrink: 0;
  color: var(--color-texto-apagado);
}

.lv-doc-fecha-sep {
  color: var(--color-texto-apagado);
}

.lv-doc-cerrar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: transparent;
  color: var(--color-texto-apagado);
  cursor: pointer;
  flex-shrink: 0;
}

.lv-doc-cerrar:hover {
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.lv-doc-cuerpo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.85rem 1.2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lv-doc-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

@media (min-width: 480px) {
  .lv-doc-meta {
    grid-template-columns: 1fr 1fr;
  }
}

.lv-doc-tarjeta {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: rgba(0, 0, 0, 0.12);
}

.lv-doc-tarjeta-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  flex-shrink: 0;
}

.lv-doc-tarjeta-txt {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.lv-doc-tarjeta-etiq {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.lv-doc-tarjeta-val {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.lv-doc-tarjeta-val--cf {
  color: var(--color-texto-suave);
  font-style: italic;
  font-weight: 500;
}

.lv-doc-items-cab {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.55rem;
}

.lv-doc-items-tit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.lv-doc-items-ico {
  color: var(--color-acento);
}

.lv-doc-items-res {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-texto-apagado);
}

.lv-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.lv-linea {
  margin: 0;
}

.lv-linea-fila {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.55rem 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.lv-linea-idx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-acento-hover);
  background: var(--color-acento-suave);
  border: 1px solid rgba(124, 140, 240, 0.25);
}

.lv-linea-cuerpo {
  min-width: 0;
}

.lv-linea-nom {
  margin: 0 0 0.3rem;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-texto);
}

.lv-linea-calc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.4rem;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-texto-suave);
}

.lv-linea-cant {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-weight: 700;
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.06);
}

.lv-linea-x,
.lv-linea-igual {
  color: var(--color-texto-apagado);
  font-weight: 600;
}

.lv-linea-importe {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-texto);
  align-self: center;
}

.lv-doc-obs {
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  border: 1px dashed var(--color-borde);
  background: rgba(0, 0, 0, 0.12);
}

.lv-doc-obs-etiq {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.lv-doc-obs-txt {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--color-texto-suave);
  white-space: pre-wrap;
}

.lv-doc-totales {
  margin-top: 0.15rem;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  border: 1px solid rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.lv-doc-totales-fila {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.84rem;
  color: var(--color-texto-suave);
}

.lv-doc-totales-fila--final {
  padding-top: 0.45rem;
  border-top: 1px solid rgba(124, 140, 240, 0.28);
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-texto);
}

.lv-doc-totales-fila--final strong {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-acento-hover);
}

.lv-doc-pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.75rem 1.2rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.lv-doc-leyenda {
  margin: 0;
  font-size: 0.7rem;
  color: var(--color-texto-apagado);
  line-height: 1.4;
  max-width: 16rem;
}

.lv-doc-btn-cerrar {
  padding: 0.55rem 1.35rem;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  background: var(--color-acento-intenso);
  color: var(--color-texto-sobre-acento);
  cursor: pointer;
  margin-left: auto;
}

.lv-doc-btn-cerrar:hover {
  filter: brightness(1.08);
}

@media (max-width: 479px) {
  .lv-linea-fila {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
  }

  .lv-linea-importe {
    grid-column: 2;
    justify-self: end;
    align-self: start;
    font-size: 0.9rem;
  }
}
</style>
