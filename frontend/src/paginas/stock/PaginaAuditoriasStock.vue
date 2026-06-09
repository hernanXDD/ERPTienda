<script setup lang="ts">
import { Eye, RefreshCw, ScrollText, X } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { etiquetaTipoAuditoriaStock } from '../../modulos/inventario/etiquetasAuditoriaStock';
import { etiquetaMotivoMovimientoStock } from '../../modulos/inventario/etiquetasMovimientoStock';
import { etiquetaRegistradoMovimientoStock } from '../../modulos/inventario/usuarioMovimientoStock';
import { useStockStore } from '../../stores/stock';
import type { AuditoriaStockDetalle, AuditoriaStockResumen, TipoAuditoriaStock } from '../../tipos/stock';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('stock-auditorias');

const stockStore = useStockStore();
const { auditorias, cargandoAuditorias } = storeToRefs(stockStore);

const refModalDetalle = useTemplateRef('refModalDetalle');

const busqueda = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');
const filtroTipo = ref<'todos' | TipoAuditoriaStock>('todos');
const auditoriaDetalle = ref<AuditoriaStockDetalle | null>(null);
const cargandoDetalle = ref(false);

function filtrosApi() {
  return {
    tipo: filtroTipo.value === 'todos' ? undefined : filtroTipo.value,
    fechaDesde: fechaDesde.value || undefined,
    fechaHasta: fechaHasta.value || undefined,
    busqueda: busqueda.value.trim() || undefined,
  };
}

async function recargarAuditorias(): Promise<void> {
  await stockStore.cargarAuditorias(filtrosApi());
}

onMounted(async () => {
  await stockStore.asegurarCargado();
  await recargarAuditorias();
});

watch([busqueda, fechaDesde, fechaHasta, filtroTipo], () => {
  void recargarAuditorias();
});

function etiquetaRegistradoAuditoria(auditoria: AuditoriaStockResumen): string {
  return auditoria.registradoPor?.etiquetaUsuario?.trim() || '—';
}

const totalMovimientosFiltrados = computed(() =>
  auditorias.value.reduce((suma, a) => suma + a.cantidadMovimientos, 0),
);

function limpiarFiltros(): void {
  busqueda.value = '';
  fechaDesde.value = '';
  fechaHasta.value = '';
  filtroTipo.value = 'todos';
}

function claseTipoAuditoria(tipo: TipoAuditoriaStock): string {
  if (tipo === 'venta') return 'aud-chip aud-chip--venta';
  if (tipo === 'compra') return 'aud-chip aud-chip--compra';
  return 'aud-chip aud-chip--conteo';
}

function claseVariacion(valor: number): string {
  if (valor > 0) return 'aud-var aud-var--sube';
  if (valor < 0) return 'aud-var aud-var--baja';
  return 'aud-var';
}

function textoVariacion(valor: number): string {
  if (valor > 0) return `+${valor}`;
  return String(valor);
}

async function abrirDetalleAuditoria(auditoria: AuditoriaStockResumen): Promise<void> {
  cargandoDetalle.value = true;
  try {
    auditoriaDetalle.value = await stockStore.obtenerDetalleAuditoria(auditoria.id);
    nextTick(() => refModalDetalle.value?.showModal());
  } finally {
    cargandoDetalle.value = false;
  }
}

function cerrarDetalleAuditoria(): void {
  refModalDetalle.value?.close();
}

function alCerrarDetalleAuditoria(): void {
  auditoriaDetalle.value = null;
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="tit-auditorias-stock">
    <div class="pg-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <ScrollText :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <h1 id="tit-auditorias-stock" class="pg-titulo">Auditorías de stock</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
      </header>

      <div class="pg-barra">
        <div class="pg-barra-col pg-barra-col--busq">
          <label class="pg-filtro-bl" for="aud-busq">
            <span class="pg-filtro-etiq">Buscar</span>
            <input
              id="aud-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Referencia, nota o usuario…"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--filtro">
          <label class="pg-filtro-bl" for="aud-tipo">
            <span class="pg-filtro-etiq">Tipo</span>
            <select id="aud-tipo" v-model="filtroTipo" class="pg-filtro-inp pg-filtro-sel">
              <option value="todos">Todos</option>
              <option value="venta">Venta</option>
              <option value="compra">Compra</option>
              <option value="conteo">Conteo</option>
            </select>
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--fecha">
          <label class="pg-filtro-bl" for="aud-fecha-desde">
            <span class="pg-filtro-etiq">Fecha desde</span>
            <input id="aud-fecha-desde" v-model="fechaDesde" type="date" class="pg-filtro-inp" />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--fecha">
          <label class="pg-filtro-bl" for="aud-fecha-hasta">
            <span class="pg-filtro-etiq">Fecha hasta</span>
            <input id="aud-fecha-hasta" v-model="fechaHasta" type="date" class="pg-filtro-inp" />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--reinicio">
          <div class="pg-filtro-bl">
            <span class="pg-filtro-etiq">Reinicio</span>
            <button type="button" class="pg-btn-reset-filtros" @click="limpiarFiltros">
              <RefreshCw :size="16" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <p class="pg-resumen pg-resumen--flex" role="status">
        <span>
          Mostrando <strong>{{ auditorias.length }}</strong>
          {{ auditorias.length === 1 ? 'auditoría' : 'auditorías' }}
          (<strong>{{ totalMovimientosFiltrados }}</strong> movimientos)
        </span>
        <span v-if="cargandoAuditorias">Cargando…</span>
      </p>

      <div class="pg-tabla-cuerpo" role="region" aria-label="Listado de auditorías de stock">
        <div class="pg-tabla-scroll aud-tabla-scroll">
          <table class="pg-tabla pg-tabla--estado">
            <thead>
              <tr>
                <th scope="col">Fecha / hora</th>
                <th scope="col">Tipo</th>
                <th scope="col">Auditoría</th>
                <th scope="col" class="aud-der">Movimientos</th>
                <th scope="col" class="aud-der">Variación neta</th>
                <th scope="col">Registrado por</th>
                <th scope="col" class="aud-der aud-col-acc">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="auditoria in auditorias" :key="auditoria.id">
                <td class="aud-mono aud-cel-fecha">{{ formatearFechaYHora(auditoria.fecha) }}</td>
                <td>
                  <span :class="claseTipoAuditoria(auditoria.tipo)">
                    {{ etiquetaTipoAuditoriaStock(auditoria.tipo) }}
                  </span>
                </td>
                <td class="aud-cel-titulo">
                  <span class="aud-titulo">{{ auditoria.titulo }}</span>
                  <span v-if="auditoria.nota" class="aud-nota-resumen">{{ auditoria.nota }}</span>
                </td>
                <td class="aud-der aud-mono">{{ auditoria.cantidadMovimientos }}</td>
                <td class="aud-der aud-mono" :class="claseVariacion(auditoria.variacionNeta)">
                  {{ textoVariacion(auditoria.variacionNeta) }}
                </td>
                <td class="aud-mute">{{ etiquetaRegistradoAuditoria(auditoria) }}</td>
                <td class="aud-der aud-col-acc">
                  <button
                    type="button"
                    class="aud-btn-detalle"
                    :disabled="cargandoDetalle"
                    @click="abrirDetalleAuditoria(auditoria)"
                  >
                    <Eye :size="16" aria-hidden="true" />
                    Detalle auditoría
                  </button>
                </td>
              </tr>
              <tr v-if="auditorias.length === 0 && !cargandoAuditorias">
                <td colspan="7" class="aud-vacio">
                  No hay auditorías para los filtros elegidos.
                </td>
              </tr>
              <tr v-if="cargandoAuditorias && auditorias.length === 0">
                <td colspan="7" class="aud-vacio">Cargando auditorías…</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <dialog
        ref="refModalDetalle"
        class="aud-dlg"
        aria-labelledby="aud-dlg-tit"
        @close="alCerrarDetalleAuditoria"
      >
        <div v-if="auditoriaDetalle" class="aud-dlg-panel" @click.stop>
          <header class="aud-dlg-cap">
            <div>
              <span :class="claseTipoAuditoria(auditoriaDetalle.tipo)">
                {{ etiquetaTipoAuditoriaStock(auditoriaDetalle.tipo) }}
              </span>
              <h2 id="aud-dlg-tit" class="aud-dlg-tit">{{ auditoriaDetalle.titulo }}</h2>
              <p class="aud-dlg-meta">
                {{ formatearFechaYHora(auditoriaDetalle.fecha) }}
                <template v-if="auditoriaDetalle.referencia">
                  · Ref. {{ auditoriaDetalle.referencia }}
                </template>
                <template v-if="auditoriaDetalle.registradoPor?.etiquetaUsuario">
                  · Registrado por {{ auditoriaDetalle.registradoPor.etiquetaUsuario }}
                </template>
              </p>
            </div>
            <button type="button" class="aud-dlg-x" aria-label="Cerrar" @click="cerrarDetalleAuditoria">
              <X :size="20" aria-hidden="true" />
            </button>
          </header>

          <p v-if="auditoriaDetalle.nota" class="aud-dlg-nota">{{ auditoriaDetalle.nota }}</p>

          <div class="aud-dlg-resumen">
            <span><strong>{{ auditoriaDetalle.cantidadMovimientos }}</strong> movimiento(s)</span>
            <span>
              Variación neta:
              <strong :class="claseVariacion(auditoriaDetalle.variacionNeta)">
                {{ textoVariacion(auditoriaDetalle.variacionNeta) }}
              </strong>
            </span>
          </div>

          <div class="aud-dlg-tabla-wrap" role="region" aria-label="Movimientos de la auditoría">
            <table class="aud-dlg-tabla">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Registrado por</th>
                  <th scope="col" class="aud-der">Variación</th>
                  <th scope="col" class="aud-der">Stock final</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in auditoriaDetalle.movimientos" :key="m.id">
                  <td>{{ m.nombreVariante }}</td>
                  <td class="aud-mute">{{ etiquetaMotivoMovimientoStock(m) }}</td>
                  <td class="aud-mute">{{ etiquetaRegistradoMovimientoStock(m) }}</td>
                  <td class="aud-der aud-mono" :class="claseVariacion(m.cantidadVariacion)">
                    {{ textoVariacion(m.cantidadVariacion) }}
                  </td>
                  <td class="aud-der aud-mono">{{ m.stockResultante }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="aud-dlg-pie">
            <button type="button" class="aud-btn-sec" @click="cerrarDetalleAuditoria">Cerrar</button>
          </footer>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.aud-tabla-scroll {
  --pg-cap-de-filas: 8;
  --pg-altura-cap-fila: 3.15rem;
}

.pg-cab-izq {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.pg-cab-ico {
  flex-shrink: 0;
  color: var(--color-acento);
  margin-top: 0.1rem;
}

.aud-enlace-interno {
  color: var(--color-acento-hover);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(124, 140, 240, 0.45);
}

.aud-enlace-interno:hover {
  filter: brightness(1.06);
}

.pg-barra-col--filtro {
  flex: 0 1 9.5rem;
  min-width: min(100%, 8.5rem);
}

.aud-der {
  text-align: right;
}

.aud-mono {
  font-variant-numeric: tabular-nums;
}

.aud-cel-fecha {
  white-space: nowrap;
  font-size: 0.785rem;
}

.aud-mute {
  color: var(--color-texto-apagado);
}

.aud-cel-titulo {
  min-width: 10rem;
}

.aud-titulo {
  display: block;
  font-weight: 600;
  color: var(--color-texto);
  line-height: 1.3;
}

.aud-nota-resumen {
  display: block;
  margin-top: 0.18rem;
  font-size: 0.76rem;
  color: var(--color-texto-apagado);
  line-height: 1.35;
  max-width: 22rem;
}

.aud-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border: 1px solid var(--color-borde);
}

.aud-chip--venta {
  color: #fbbf24;
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.32);
}

.aud-chip--compra {
  color: var(--color-exito);
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.32);
}

.aud-chip--conteo {
  color: var(--color-acento-hover);
  background: rgba(124, 140, 240, 0.1);
  border-color: rgba(124, 140, 240, 0.32);
}

.aud-var--sube {
  color: var(--color-exito);
  font-weight: 700;
}

.aud-var--baja {
  color: var(--color-peligro);
  font-weight: 700;
}

.aud-col-acc {
  min-width: 9.5rem;
  white-space: nowrap;
}

.aud-btn-detalle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.62rem;
  border-radius: 9px;
  border: 1px solid rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.08);
  color: var(--color-acento-hover);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.aud-btn-detalle:hover {
  filter: brightness(1.06);
}

.aud-vacio {
  padding: 2rem 1rem !important;
  text-align: center !important;
  color: var(--color-texto-apagado);
  border-bottom: none !important;
  line-height: 1.5;
}

.aud-dlg {
  border: none;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(46rem, 100%);
  border-radius: 14px;
  background: transparent;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(124, 140, 240, 0.12);
}

.aud-dlg::backdrop {
  background: rgba(8, 10, 20, 0.72);
  backdrop-filter: blur(3px);
}

.aud-dlg-panel {
  padding: 1.1rem clamp(1rem, 3vw, 1.35rem) 1rem;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  border-radius: 14px;
  max-height: min(92dvh, 40rem);
  display: flex;
  flex-direction: column;
}

.aud-dlg-cap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.65rem;
}

.aud-dlg-tit {
  margin: 0.45rem 0 0;
  font-size: clamp(1rem, 2.6vw, 1.15rem);
  font-weight: 700;
}

.aud-dlg-meta {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.aud-dlg-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.05rem;
  height: 2.05rem;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-apagado);
  cursor: pointer;
}

.aud-dlg-nota {
  margin: 0 0 0.65rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
  background: rgba(124, 140, 240, 0.06);
  border: 1px solid rgba(124, 140, 240, 0.18);
}

.aud-dlg-resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1rem;
  margin-bottom: 0.65rem;
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.aud-dlg-tabla-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.aud-dlg-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.aud-dlg-tabla th,
.aud-dlg-tabla td {
  padding: 0.52rem 0.72rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: top;
}

.aud-dlg-tabla th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-elevado);
}

.aud-dlg-pie {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-borde);
}

.aud-btn-sec {
  cursor: pointer;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.45rem 0.92rem;
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
}
</style>
