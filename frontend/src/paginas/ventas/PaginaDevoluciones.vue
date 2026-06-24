<script setup lang="ts">
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Undo2,
  UserRound,
  Wallet,
  X,
  Eye,
} from 'lucide-vue-next';
import { onMounted, useTemplateRef, watch, computed, ref } from 'vue';
import ModalDetalleDevolucionHistorial from '../../componentes/ventas/ModalDetalleDevolucionHistorial.vue';
import ModalVistaCupon from '../../componentes/ventas/ModalVistaCupon.vue';
import ProcesoCambioDevolucion from '../../componentes/ventas/ProcesoCambioDevolucion.vue';
import { useProcesoDevolucion } from '../../composables/useProcesoDevolucion';
import { etiquetaFormaPago } from '../../datos/formasPago';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { useCatalogoStore } from '../../stores/catalogo';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useCuponesDescuentoStore } from '../../stores/cuponesDescuento';
import { useStockStore } from '../../stores/stock';
import { useVentasStore } from '../../stores/ventas';
import type { IdFormaPago, VentaRegistrada } from '../../tipos/venta';
import type { DevolucionRegistrada } from '../../tipos/devolucion';
import type { CuponDescuentoRegistrado } from '../../tipos/cuponDescuento';
import { etiquetaValorDescuentoCupon } from '../../tipos/cuponDescuento';
import type { ResultadoOperacionDevolucion } from '../../composables/useProcesoDevolucion';
import {
  formatearFechaDiaMesAnio,
  formatearHoraAmPm,
} from '../../utilidades/formatoFechaHora';
import { notificarOk } from '../../utilidades/notificacion';

const descripcionPagina = obtenerDescripcionPagina('ventas-devoluciones');
const ventasStore = useVentasStore();
const catalogoStore = useCatalogoStore();
const stockStore = useStockStore();
const configuracionStore = useConfiguracionSistemaStore();
const cuponesStore = useCuponesDescuentoStore();

const proceso = useProcesoDevolucion();
const {
  fase,
  seccionListado,
  busqueda,
  busquedaHistorial,
  cargandoVentas,
  errorVentas,
  ventasElegibles,
  historialFiltrado,
  cargandoHistorial,
  ventaOrigen,
  cantidadesLinea,
  mensajeError,
  resultadoOperacion,
  emitirCuponAlConfirmar,
  puedeRegistrar,
  plazoDevolucionTexto,
  hayFiltrosActivos,
  hayFiltrosHistorialActivos,
  subtotalDialogoDevolucion,
  unidadesSeleccionadasDialogo,
  puedeContinuarACambio,
  registrando,
  limpiarFiltros,
  limpiarFiltrosHistorial,
  cargarHistorialDevoluciones,
  seleccionarVentaParaDialogo,
  cerrarDialogoSeleccion,
  actualizarCantidadLinea,
  devolverTodoEnDialogo,
  limpiarSeleccionEnDialogo,
  continuarACambio,
  confirmarSoloDevolucion,
  unidadesPendientesDevolver,
} = proceso;

const refSeleccion = useTemplateRef<HTMLDialogElement>('refSeleccion');
const devolucionDetalle = ref<DevolucionRegistrada | null>(null);
const cuponAVer = ref<CuponDescuentoRegistrado | null>(null);

const cuponPorDevolucionId = computed(() => {
  const mapa = new Map<string, string>();
  for (const cupon of cuponesStore.cupones) {
    if (cupon.devolucionId) {
      mapa.set(cupon.devolucionId, cupon.numero);
    }
  }
  return mapa;
});

function cuponEmitidoPorDevolucion(devolucionId: string): string | null {
  return cuponPorDevolucionId.value.get(devolucionId) ?? null;
}

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

onMounted(() => {
  void ventasStore.cargarVentas({ forzar: true });
  void catalogoStore.cargar({ forzar: true });
  void stockStore.cargar({ forzar: true });
  void configuracionStore.cargar();
  void cargarHistorialDevoluciones();
  void cuponesStore.cargar({ forzar: true });
});

watch(seccionListado, (seccion) => {
  if (seccion === 'historial') {
    void cargarHistorialDevoluciones();
    void cuponesStore.cargar({ forzar: true });
  }
});

function claseChipPago(id: IdFormaPago): string {
  return `lv-chip lv-chip--${id.toLowerCase().replace(/_/g, '-')}`;
}

function mensajeConfirmacionDevolucion(resultado: ResultadoOperacionDevolucion): string {
  const partes = [
    `Devolución ${resultado.devolucion.numero} registrada por ${formatoPeso.format(resultado.devolucion.total)}.`,
  ];
  if (resultado.ventaNueva) {
    partes.push(`Nueva venta ${resultado.ventaNueva.numero} por ${formatoPeso.format(resultado.ventaNueva.total)}.`);
  }
  if (resultado.cupon) {
    partes.push(`Cupón ${resultado.cupon.numero} emitido.`);
  }
  if (resultado.advertenciaCupon) {
    partes.push(resultado.advertenciaCupon);
  }
  if (resultado.advertenciaVentaNueva) {
    partes.push(resultado.advertenciaVentaNueva);
  }
  return partes.join(' ');
}

function mostrarConfirmacionDevolucion(resultado: ResultadoOperacionDevolucion): void {
  notificarOk(mensajeConfirmacionDevolucion(resultado), 7000);
}

function abrirSeleccionVenta(venta: VentaRegistrada): void {
  seleccionarVentaParaDialogo(venta);
  refSeleccion.value?.showModal();
}

function cerrarModalSeleccion(): void {
  refSeleccion.value?.close();
  cerrarDialogoSeleccion();
}

function alContinuarACambio(): void {
  if (!puedeContinuarACambio.value) return;
  continuarACambio();
  refSeleccion.value?.close();
}

async function alConfirmarSoloDevolucion(): Promise<void> {
  const resultado = await confirmarSoloDevolucion();
  if (!resultado) return;
  refSeleccion.value?.close();
  mostrarConfirmacionDevolucion(resultado);
}

function alCerrarModalSeleccion(): void {
  if (fase.value === 'listado') {
    cerrarDialogoSeleccion();
  }
}

function alFinalizarCambio(): void {
  if (resultadoOperacion.value) {
    mostrarConfirmacionDevolucion(resultadoOperacion.value);
  }
}

function cerrarCartelExito(): void {
  resultadoOperacion.value = null;
}

function abrirDetalleDevolucion(devolucion: DevolucionRegistrada): void {
  devolucionDetalle.value = devolucion;
  void ventasStore.cargarVentas({ forzar: false });
  void cuponesStore.cargar({ forzar: true });
}

function cerrarDetalleDevolucion(): void {
  devolucionDetalle.value = null;
}

function abrirVerCupon(cupon: CuponDescuentoRegistrado): void {
  cuponAVer.value = cupon;
}

function cerrarVerCupon(): void {
  cuponAVer.value = null;
}
</script>

<template>
  <section
    class="pg-wrap"
    :class="{ 'pg-wrap--cambio': fase === 'cambio' }"
    aria-labelledby="titulo-devoluciones"
  >
    <div class="pg-marco" :class="{ 'pg-marco--cambio': fase === 'cambio' }">
      <template v-if="fase === 'listado'">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <RotateCcw :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Ventas · Postventa</p>
              <h1 id="titulo-devoluciones" class="pg-titulo">Devoluciones</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
      </header>

      <p v-if="!puedeRegistrar" class="dev-banner-lectura" role="status">
        Tenés acceso de lectura. Para registrar devoluciones necesitás permiso para registrar ventas.
      </p>

      <Transition name="dev-cartel">
        <aside
          v-if="resultadoOperacion && fase === 'listado'"
          class="dev-cartel-confirmacion"
          role="status"
          aria-live="polite"
          aria-labelledby="dev-cartel-titulo"
        >
          <div class="dev-cartel-ico" aria-hidden="true">
            <CheckCircle2 :size="28" stroke-width="2" />
          </div>
          <div class="dev-cartel-cuerpo">
            <h2 id="dev-cartel-titulo" class="dev-cartel-tit">Devolución confirmada</h2>
            <p class="dev-cartel-desc">
              La operación se registró correctamente. Revisá el detalle abajo o consultalo en el historial.
            </p>
            <ul class="dev-cartel-lista">
              <li>
                Devolución <strong>{{ resultadoOperacion.devolucion.numero }}</strong>
                · {{ formatoPeso.format(resultadoOperacion.devolucion.total) }}
              </li>
              <li v-if="resultadoOperacion.ventaNueva">
                Nueva venta <strong>{{ resultadoOperacion.ventaNueva.numero }}</strong>
                · {{ formatoPeso.format(resultadoOperacion.ventaNueva.total) }}
              </li>
              <li v-if="resultadoOperacion.cupon">
                Cupón <strong>{{ resultadoOperacion.cupon.numero }}</strong>
                · {{ etiquetaValorDescuentoCupon(resultadoOperacion.cupon) }}
              </li>
            </ul>
            <p
              v-if="resultadoOperacion.advertenciaVentaNueva"
              class="dev-cartel-advertencia"
              role="alert"
            >
              {{ resultadoOperacion.advertenciaVentaNueva }}
            </p>
            <p
              v-if="resultadoOperacion.advertenciaCupon"
              class="dev-cartel-advertencia"
              role="alert"
            >
              {{ resultadoOperacion.advertenciaCupon }}
            </p>
            <div v-if="resultadoOperacion.cupon" class="dev-cartel-acciones">
              <button type="button" class="dev-btn-ver-cupon" @click="abrirVerCupon(resultadoOperacion.cupon)">
                <Eye :size="16" aria-hidden="true" />
                Ver cupón
              </button>
            </div>
          </div>
          <button type="button" class="dev-cartel-cerrar" aria-label="Cerrar aviso" @click="cerrarCartelExito">
            <X :size="18" stroke-width="2" aria-hidden="true" />
          </button>
        </aside>
      </Transition>

      <div class="pg-barra lv-barra-filtros dev-barra-filtros">
        <div class="pg-barra-col dev-barra-col--seccion">
          <span class="pg-filtro-etiq">Sección</span>
          <div class="dev-secciones dev-secciones--integrada" role="tablist" aria-label="Sección de devoluciones">
            <button
              type="button"
              role="tab"
              class="dev-seccion-btn"
              :class="{ 'dev-seccion-btn--on': seccionListado === 'ventas' }"
              :aria-selected="seccionListado === 'ventas'"
              @click="seccionListado = 'ventas'"
            >
              Nueva devolución
            </button>
            <button
              type="button"
              role="tab"
              class="dev-seccion-btn"
              :class="{ 'dev-seccion-btn--on': seccionListado === 'historial' }"
              :aria-selected="seccionListado === 'historial'"
              @click="seccionListado = 'historial'"
            >
              Historial
            </button>
          </div>
        </div>

        <div class="pg-barra-col pg-barra-col--busq">
          <label v-if="seccionListado === 'ventas'" class="pg-filtro-bl" for="dev-busq">
            <span class="pg-filtro-etiq">Buscar venta</span>
            <input
              id="dev-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Número, cliente o documento…"
              autocomplete="off"
            />
          </label>
          <label v-else class="pg-filtro-bl" for="dev-busq-hist">
            <span class="pg-filtro-etiq">Buscar devolución</span>
            <input
              id="dev-busq-hist"
              v-model="busquedaHistorial"
              type="search"
              class="pg-filtro-inp"
              placeholder="Número, venta o cliente…"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--reinicio">
          <div class="pg-filtro-bl">
            <span class="pg-filtro-etiq">Reinicio</span>
            <button
              v-if="seccionListado === 'ventas'"
              type="button"
              class="pg-btn-reset-filtros"
              :disabled="!hayFiltrosActivos"
              @click="limpiarFiltros"
            >
              <RefreshCw :size="16" aria-hidden="true" />
              Limpiar filtros
            </button>
            <button
              v-else
              type="button"
              class="pg-btn-reset-filtros"
              :disabled="!hayFiltrosHistorialActivos"
              @click="limpiarFiltrosHistorial"
            >
              <RefreshCw :size="16" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <template v-if="seccionListado === 'ventas'">
      <p v-if="errorVentas" class="lv-alerta-carga" role="alert">
        {{ errorVentas }}
        <button type="button" class="lv-alerta-reintentar" @click="ventasStore.cargarVentas({ forzar: true })">
          Reintentar
        </button>
      </p>

      <p v-else-if="cargandoVentas && ventasElegibles.length === 0" class="lv-cargando" role="status">
        <Loader2 :size="18" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
        Cargando ventas desde el servidor…
      </p>

      <p class="pg-resumen pg-resumen--flex" role="status">
        <span>
          Mostrando <strong>{{ ventasElegibles.length }}</strong>
          {{ ventasElegibles.length === 1 ? 'venta elegible' : 'ventas elegibles' }}
        </span>
        <span class="dev-resumen-plazo">
          Plazo máximo: <strong>{{ plazoDevolucionTexto }}</strong>
        </span>
      </p>

      <div class="dev-ventas-contenedor" role="region" aria-label="Ventas disponibles para devolución">
        <div v-if="ventasElegibles.length > 0" class="dev-ventas-scroll">
          <div
            class="dev-ventas-grid"
            role="list"
            aria-label="Ventas elegibles"
          >
          <article
            v-for="v in ventasElegibles"
            :key="v.id"
            class="dev-venta-card"
            role="listitem"
          >
            <header class="dev-venta-card-cab">
              <span class="lv-num">{{ v.numero }}</span>
              <time class="dev-venta-card-fecha" :datetime="v.fecha">
                <span class="lv-fecha-dia">{{ formatearFechaDiaMesAnio(v.fecha) }}</span>
                <span class="lv-fecha-hora">{{ formatearHoraAmPm(v.fecha) }}</span>
              </time>
            </header>

            <p class="dev-venta-card-cli" :class="{ 'lv-cli--cf': !v.clienteId }">
              {{ v.nombreClienteMostrar }}
            </p>

            <div class="dev-venta-card-chips">
              <span :class="claseChipPago(v.formaPago)">
                {{ etiquetaFormaPago(v.formaPago) }}
              </span>
              <span class="dev-chip-pendiente">
                {{ unidadesPendientesDevolver(v) }}
                {{ unidadesPendientesDevolver(v) === 1 ? 'prenda pendiente' : 'prendas pendientes' }}
              </span>
            </div>

            <footer class="dev-venta-card-pie">
              <div class="dev-venta-card-total">
                <span class="dev-venta-card-total-etiq">Total venta</span>
                <strong class="lv-mono">{{ formatoPeso.format(v.total) }}</strong>
              </div>
              <button
                type="button"
                class="dev-venta-card-btn"
                :disabled="!puedeRegistrar"
                :aria-label="`Registrar devolución de venta ${v.numero}`"
                @click="abrirSeleccionVenta(v)"
              >
                <Undo2 :size="15" stroke-width="2" aria-hidden="true" />
                Devolver
              </button>
            </footer>
          </article>
          </div>
        </div>

        <p v-else class="dev-ventas-vacio" role="status">
          No hay ventas dentro del plazo de {{ plazoDevolucionTexto }} con ítems pendientes de
          devolver. Probá limpiar la búsqueda o revisá el historial de ventas.
        </p>
      </div>
      </template>

      <template v-else>
        <p v-if="cargandoHistorial && historialFiltrado.length === 0" class="lv-cargando" role="status">
          <Loader2 :size="18" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
          Cargando historial…
        </p>

        <p v-else class="pg-resumen" role="status">
          Mostrando <strong>{{ historialFiltrado.length }}</strong>
          {{ historialFiltrado.length === 1 ? 'devolución' : 'devoluciones' }}
        </p>

        <div class="pg-tabla-cuerpo" role="region" aria-label="Historial de devoluciones">
          <div class="pg-tabla-scroll lv-tabla-scroll lv-tabla-scroll--escritorio">
            <table class="pg-tabla pg-tabla--estado">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Devolución</th>
                  <th scope="col">Venta</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Cupón</th>
                  <th scope="col" class="pg-der">Total</th>
                  <th scope="col" class="pg-der">Prendas</th>
                  <th scope="col" class="lv-col-acc">
                    <span class="pg-sr">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in historialFiltrado" :key="d.id" class="lv-fila">
                  <td class="lv-cel-fecha">
                    <span class="lv-fecha-dia">{{ formatearFechaDiaMesAnio(d.fecha) }}</span>
                    <span class="lv-fecha-hora">{{ formatearHoraAmPm(d.fecha) }}</span>
                  </td>
                  <td><span class="lv-num">{{ d.numero }}</span></td>
                  <td><span class="lv-num">{{ d.numeroVenta }}</span></td>
                  <td>
                    <span class="lv-cli">{{ d.nombreClienteMostrar || '—' }}</span>
                  </td>
                  <td>
                    <span v-if="cuponEmitidoPorDevolucion(d.id)" class="lv-num">
                      {{ cuponEmitidoPorDevolucion(d.id) }}
                    </span>
                    <span v-else class="dev-sin-cupon">—</span>
                  </td>
                  <td class="pg-der lv-mono lv-cel-total">{{ formatoPeso.format(d.total) }}</td>
                  <td class="pg-der lv-mono">
                    {{ d.lineas.reduce((acc, ln) => acc + ln.cantidad, 0) }}
                  </td>
                  <td class="lv-col-acc">
                    <button
                      type="button"
                      class="lv-det"
                      :aria-label="`Ver detalle de devolución ${d.numero}`"
                      @click.stop="abrirDetalleDevolucion(d)"
                    >
                      <Eye :size="15" stroke-width="2" aria-hidden="true" />
                      Detalle
                    </button>
                  </td>
                </tr>
                <tr v-if="historialFiltrado.length === 0">
                  <td colspan="8" class="pg-vacio">Todavía no hay devoluciones registradas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
      </template>

      <ProcesoCambioDevolucion
        v-else-if="fase === 'cambio'"
        :proceso="proceso"
        @finalizado="alFinalizarCambio"
      />
    </div>

    <Teleport to="body">
      <dialog
        ref="refSeleccion"
        class="lv-modal dev-modal-seleccion"
        aria-labelledby="dev-seleccion-titulo"
        @close="alCerrarModalSeleccion"
      >
        <form v-if="ventaOrigen" class="lv-doc dev-doc-seleccion" @submit.prevent="alContinuarACambio">
          <header class="lv-doc-cab dev-doc-cab">
            <div class="lv-doc-cab-izq">
              <p class="lv-doc-tipo">Devolución de venta</p>
              <h2 id="dev-seleccion-titulo" class="lv-doc-num">{{ ventaOrigen.numero }}</h2>
              <p class="lv-doc-fecha">
                <CalendarClock :size="15" stroke-width="2" class="lv-doc-fecha-ico" aria-hidden="true" />
                <time :datetime="ventaOrigen.fecha">
                  {{ formatearFechaDiaMesAnio(ventaOrigen.fecha) }}
                  <span class="lv-doc-fecha-sep">·</span>
                  {{ formatearHoraAmPm(ventaOrigen.fecha) }}
                </time>
              </p>
            </div>
            <button type="button" class="lv-doc-cerrar" aria-label="Cerrar" @click="cerrarModalSeleccion">
              <X :size="20" stroke-width="2" aria-hidden="true" />
            </button>
          </header>

          <div class="lv-doc-cuerpo">
            <section class="dev-dialog-meta" aria-label="Datos de la venta">
              <div class="lv-doc-tarjeta">
                <span class="lv-doc-tarjeta-ico" aria-hidden="true">
                  <UserRound :size="18" stroke-width="2" />
                </span>
                <div class="lv-doc-tarjeta-txt">
                  <span class="lv-doc-tarjeta-etiq">Cliente</span>
                  <span
                    class="lv-doc-tarjeta-val"
                    :class="{ 'lv-doc-tarjeta-val--cf': !ventaOrigen.clienteId }"
                  >
                    {{ ventaOrigen.nombreClienteMostrar }}
                  </span>
                </div>
              </div>
              <div class="lv-doc-tarjeta">
                <span class="lv-doc-tarjeta-ico" aria-hidden="true">
                  <Wallet :size="18" stroke-width="2" />
                </span>
                <div class="lv-doc-tarjeta-txt">
                  <span class="lv-doc-tarjeta-etiq">Forma de pago</span>
                  <span class="lv-doc-tarjeta-val">
                    <span :class="claseChipPago(ventaOrigen.formaPago)">
                      {{ etiquetaFormaPago(ventaOrigen.formaPago) }}
                    </span>
                  </span>
                </div>
              </div>
            </section>

            <div
              class="dev-dialog-resumen"
              :class="{ 'dev-dialog-resumen--vacio': unidadesSeleccionadasDialogo === 0 }"
              role="status"
              aria-live="polite"
            >
              <span class="dev-dialog-resumen-cant">
                {{
                  unidadesSeleccionadasDialogo === 0
                    ? 'Seleccioná las prendas a devolver'
                    : `${unidadesSeleccionadasDialogo} ${
                        unidadesSeleccionadasDialogo === 1 ? 'prenda seleccionada' : 'prendas seleccionadas'
                      }`
                }}
              </span>
              <strong class="dev-dialog-resumen-monto lv-mono">
                {{ formatoPeso.format(subtotalDialogoDevolucion) }}
              </strong>
            </div>

            <section class="lv-doc-items" aria-labelledby="dev-seleccion-lineas-tit">
              <div class="lv-doc-items-cab">
                <h3 id="dev-seleccion-lineas-tit" class="lv-doc-items-tit">Prendas de la venta</h3>
                <div class="dev-dialog-acciones-rapidas">
                  <button
                    type="button"
                    class="lv-btn-sec lv-btn-sec--compacto"
                    @click="devolverTodoEnDialogo"
                  >
                    Devolver todo
                  </button>
                  <button
                    type="button"
                    class="lv-btn-sec lv-btn-sec--compacto"
                    :disabled="unidadesSeleccionadasDialogo === 0"
                    @click="limpiarSeleccionEnDialogo"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <ol class="dev-lineas" role="list">
                <li
                  v-for="ln in cantidadesLinea"
                  :key="ln.ventaLineaId"
                  class="dev-linea"
                  :class="{ 'dev-linea--activa': ln.cantidad > 0 }"
                >
                  <div class="dev-linea-info">
                    <p class="dev-linea-nom">{{ ln.nombre }}</p>
                    <p class="dev-linea-meta lv-mono">
                      Disponible: {{ ln.cantidadDisponible }}
                      · {{ formatoPeso.format(ln.precioUnitario) }} c/u
                    </p>
                    <p v-if="ln.cantidad > 0" class="dev-linea-subtotal lv-mono">
                      {{ formatoPeso.format(ln.cantidad * ln.precioUnitario) }}
                    </p>
                  </div>
                  <div class="dev-cantidad" role="group" :aria-label="`Cantidad a devolver de ${ln.nombre}`">
                    <button
                      type="button"
                      class="dev-cantidad-btn"
                      :disabled="ln.cantidad <= 0"
                      :aria-label="`Quitar una unidad de ${ln.nombre}`"
                      @click="actualizarCantidadLinea(ln.ventaLineaId, ln.cantidad - 1)"
                    >
                      <Minus :size="16" aria-hidden="true" />
                    </button>
                    <span class="dev-cantidad-valor lv-mono" aria-live="polite">{{ ln.cantidad }}</span>
                    <button
                      type="button"
                      class="dev-cantidad-btn"
                      :disabled="ln.cantidad >= ln.cantidadDisponible"
                      :aria-label="`Agregar una unidad de ${ln.nombre}`"
                      @click="actualizarCantidadLinea(ln.ventaLineaId, ln.cantidad + 1)"
                    >
                      <Plus :size="16" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              </ol>
            </section>

            <p v-if="mensajeError" class="lv-alerta-carga dev-alerta-inline" role="alert">
              {{ mensajeError }}
            </p>
          </div>

          <footer class="lv-doc-pie dev-doc-pie">
            <label
              v-if="subtotalDialogoDevolucion > 0"
              class="dev-cupon-opt"
              for="dev-emitir-cupon"
            >
              <input
                id="dev-emitir-cupon"
                v-model="emitirCuponAlConfirmar"
                type="checkbox"
              />
              <span>
                Emitir cupón por
                <strong>{{ formatoPeso.format(subtotalDialogoDevolucion) }}</strong>
                al confirmar
              </span>
            </label>

            <p class="lv-doc-leyenda">
              Confirmá solo la devolución o continuá al cambio para cargar prendas nuevas.
            </p>

            <div class="dev-doc-pie-acciones">
              <button type="button" class="lv-doc-btn-imprimir" @click="cerrarModalSeleccion">
                Cancelar
              </button>
              <button
                type="button"
                class="lv-doc-btn-imprimir dev-btn-confirmar"
                :disabled="!puedeContinuarACambio || registrando"
                @click="alConfirmarSoloDevolucion"
              >
                <Loader2
                  v-if="registrando"
                  :size="16"
                  class="lv-btn-cargar-fact-ico--girar"
                  aria-hidden="true"
                />
                Confirmar devolución
              </button>
              <button
                type="submit"
                class="lv-doc-btn-cerrar lv-doc-btn-cerrar--accion"
                :disabled="!puedeContinuarACambio || registrando"
              >
                Continuar al cambio
                <ArrowRight :size="16" aria-hidden="true" />
              </button>
            </div>
          </footer>
        </form>
      </dialog>
    </Teleport>

    <ModalDetalleDevolucionHistorial
      v-if="devolucionDetalle"
      :devolucion="devolucionDetalle"
      @cerrar="cerrarDetalleDevolucion"
    />

    <ModalVistaCupon v-if="cuponAVer" :cupon="cuponAVer" @cerrar="cerrarVerCupon" />
  </section>
</template>

<style scoped>
.lv-tabla-scroll {
  --pg-cap-de-filas: 8;
  --pg-altura-cap-fila: 3.15rem;
}

.dev-ventas-contenedor {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 1.25rem;
}

.dev-ventas-scroll {
  --dev-grid-columnas: 4;
  --dev-grid-filas-visibles: 3;
  --dev-grid-gap: 0.75rem;
  --dev-altura-card: 9.35rem;
  --dev-scroll-padding: 0.75rem;

  max-height: calc(
    var(--dev-grid-filas-visibles) * var(--dev-altura-card) +
      (var(--dev-grid-filas-visibles) - 1) * var(--dev-grid-gap) + 2 * var(--dev-scroll-padding)
  );
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--dev-scroll-padding);
  border-radius: 14px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  scrollbar-gutter: stable;
}

.dev-ventas-grid {
  display: grid;
  grid-template-columns: repeat(var(--dev-grid-columnas), minmax(0, 1fr));
  gap: var(--dev-grid-gap);
}

.dev-venta-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: var(--dev-altura-card);
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.dev-venta-card:hover {
  border-color: var(--color-acento-borde);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.dev-venta-card-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.dev-venta-card-fecha {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.08rem;
  text-align: right;
}

.dev-venta-card-cli {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dev-venta-card-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dev-venta-card-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.55rem;
  margin-top: 0.15rem;
  border-top: 1px solid var(--color-borde);
}

.dev-venta-card-total {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.dev-venta-card-total-etiq {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.dev-venta-card-total strong {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-acento-hover);
}

.dev-venta-card-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: 10px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
  cursor: pointer;
  transition: filter 0.12s ease, background 0.12s ease;
}

.dev-venta-card-btn:hover:not(:disabled) {
  filter: brightness(1.03);
  background: var(--color-acento);
  color: var(--color-texto-inverso, #fff);
}

.dev-venta-card-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dev-ventas-vacio {
  margin: 0;
  padding: 2.5rem 1rem;
  text-align: center;
  border-radius: 14px;
  border: 1px dashed var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  line-height: 1.55;
}

@media (max-width: 1279px) {
  .dev-ventas-scroll {
    --dev-grid-columnas: 3;
  }
}

@media (max-width: 991px) {
  .dev-ventas-scroll {
    --dev-grid-columnas: 2;
  }
}

@media (max-width: 559px) {
  .dev-ventas-scroll {
    --dev-grid-columnas: 1;
    --dev-altura-card: 8.75rem;
  }
}

.dev-modal-seleccion {
  width: min(44rem, calc(100vw - 1.25rem));
}

.dev-doc-seleccion {
  max-height: min(92dvh, 52rem);
}

.dev-dialog-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.55rem;
}

.dev-dialog-resumen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.dev-dialog-resumen--vacio {
  border-color: var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.dev-dialog-resumen-cant {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-texto-suave);
}

.dev-dialog-resumen--vacio .dev-dialog-resumen-cant {
  color: var(--color-texto-apagado);
}

.dev-dialog-resumen-monto {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-acento-hover);
}

.dev-dialog-resumen--vacio .dev-dialog-resumen-monto {
  color: var(--color-texto-apagado);
}

.dev-dialog-acciones-rapidas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.lv-btn-sec--compacto {
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
}

.lv-btn-sec:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dev-linea--activa {
  border-color: var(--color-acento-borde);
  background: color-mix(in srgb, var(--color-acento-suave) 55%, var(--color-fondo-cabecera));
}

.dev-linea-subtotal {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-acento-hover);
}

.dev-cantidad {
  display: inline-flex;
  align-items: center;
  gap: 0;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  overflow: hidden;
  flex-shrink: 0;
}

.dev-cantidad-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: transparent;
  color: var(--color-texto);
  cursor: pointer;
}

.dev-cantidad-btn:hover:not(:disabled) {
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
}

.dev-cantidad-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.dev-cantidad-valor {
  min-width: 2rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 700;
}

.dev-doc-pie {
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.dev-doc-pie-acciones {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.45rem;
}

@media (min-width: 520px) {
  .dev-doc-pie-acciones {
    grid-template-columns: auto 1fr auto;
    align-items: center;
  }
}

.dev-banner-lectura {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px dashed var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-suave);
  font-size: 0.84rem;
  line-height: 1.45;
}

.dev-barra-filtros {
  margin-bottom: 1rem;
}

.dev-barra-col--seccion {
  flex: 0 1 17.5rem;
  min-width: min(100%, 15rem);
}

.dev-secciones--integrada {
  display: flex;
  gap: 0.25rem;
  margin: 0;
  padding: 0.2rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  width: 100%;
}

.dev-seccion-btn {
  flex: 1 1 0;
  border: none;
  border-radius: calc(var(--radio-control) - 2px);
  padding: 0.45rem 0.65rem;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
}

@media (max-width: 719px) {
  .dev-barra-col--seccion {
    flex: 1 1 100%;
  }
}

.dev-seccion-btn:hover {
  color: var(--color-texto);
  background: var(--color-fondo-elevado);
}

.dev-seccion-btn--on {
  color: var(--color-acento-hover);
  background: var(--color-acento-suave);
  box-shadow: inset 0 0 0 1px var(--color-acento-borde);
}

.dev-cartel-confirmacion {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin: 0 clamp(1rem, 3vw, 1.65rem) 1rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  border: 1px solid var(--color-exito-borde);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-exito-suave) 88%, var(--color-fondo-elevado)),
    var(--color-fondo-elevado)
  );
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.dev-cartel-ico {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  background: var(--color-exito-suave);
  color: var(--color-exito);
  border: 1px solid var(--color-exito-borde);
}

.dev-cartel-cuerpo {
  flex: 1;
  min-width: 0;
}

.dev-cartel-tit {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-exito);
}

.dev-cartel-desc {
  margin: 0.35rem 0 0.65rem;
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.dev-cartel-lista {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--color-texto);
}

.dev-cartel-lista strong {
  font-variant-numeric: tabular-nums;
}

.dev-cartel-advertencia {
  margin: 0.75rem 0 0;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-advertencia, #b45309) 35%, transparent);
  background: color-mix(in srgb, var(--color-advertencia, #b45309) 8%, transparent);
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto);
}

.dev-cartel-acciones {
  margin-top: 0.85rem;
}

.dev-btn-ver-cupon {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.dev-btn-ver-cupon:hover {
  background: var(--color-hover-neutro);
}

.dev-cartel-cerrar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-texto-apagado);
  cursor: pointer;
}

.dev-cartel-cerrar:hover {
  background: var(--color-hover-neutro);
  color: var(--color-texto);
}

.dev-cartel-enter-active,
.dev-cartel-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.dev-cartel-enter-from,
.dev-cartel-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}

.dev-sin-cupon {
  color: var(--color-texto-apagado);
}

.dev-cupon-opt {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin: 0 0 0.65rem;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  font-size: 0.86rem;
  line-height: 1.45;
  cursor: pointer;
}

.dev-cupon-opt input {
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.dev-btn-confirmar {
  border-color: var(--color-exito-borde);
  color: var(--color-exito);
  background: var(--color-exito-suave);
}

.dev-btn-confirmar:hover:not(:disabled) {
  filter: brightness(1.03);
}

.dev-exito-barcode {
  margin-top: 1rem;
}

.dev-resumen-plazo {
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.dev-resumen-plazo strong {
  color: var(--color-texto);
}

.dev-chip-pendiente {
  display: inline-block;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-advertencia);
  background: var(--color-advertencia-suave);
  border: 1px solid var(--color-advertencia-borde);
}

.lv-fila {
  transition: background 0.12s ease;
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
  border: 1px solid var(--color-acento-borde);
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
  color: var(--color-exito);
  background: var(--color-exito-suave);
  border-color: var(--color-exito-borde);
}

.lv-chip--debito,
.lv-chip--credito,
.lv-chip--transferencia {
  color: var(--color-acento-hover);
  background: var(--color-acento-suave);
  border-color: var(--color-acento-borde);
}

.lv-chip--cuenta-corriente {
  color: var(--color-advertencia);
  background: var(--color-advertencia-suave);
  border-color: var(--color-advertencia-borde);
}

.lv-mono {
  font-variant-numeric: tabular-nums;
}

.lv-cel-total {
  font-weight: 700;
}

.lv-col-acc {
  width: 1%;
  white-space: nowrap;
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

.lv-det:hover:not(:disabled) {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.lv-alerta-carga {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 0 clamp(1rem, 3vw, 1.65rem) 1rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-peligro-borde);
  background: var(--color-peligro-suave);
  color: var(--color-peligro);
  font-size: 0.9rem;
}

.dev-alerta-inline {
  margin: 0;
}

.lv-alerta-reintentar {
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  font-size: 0.85rem;
  cursor: pointer;
}

.lv-cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 clamp(1rem, 3vw, 1.65rem) 1rem;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
}

.lv-btn-cargar-fact-ico--girar {
  animation: dev-girar 0.8s linear infinite;
}

@keyframes dev-girar {
  to {
    transform: rotate(360deg);
  }
}

.lv-modal {
  margin: auto;
  padding: 0;
  width: min(40rem, calc(100vw - 1.25rem));
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

.lv-doc-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.55rem;
}

.lv-doc-tarjeta {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.lv-doc-tarjeta-ico {
  flex-shrink: 0;
  color: var(--color-acento);
}

.lv-doc-tarjeta-etiq {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.lv-doc-tarjeta-val {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.lv-doc-tarjeta-val--cf {
  font-style: italic;
  color: var(--color-texto-suave);
}

.lv-doc-items-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.lv-doc-items-tit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.92rem;
  font-weight: 650;
}

.lv-doc-items-ico {
  color: var(--color-acento);
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
}

.lv-btn-sec:hover {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.dev-lineas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dev-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo-cabecera);
}

.dev-linea-nom {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
}

.dev-linea-meta {
  margin: 0.2rem 0 0;
  font-size: 0.76rem;
  color: var(--color-texto-apagado);
}

.dev-obs {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dev-obs-inp {
  resize: vertical;
  min-height: 3rem;
}

.lv-doc-pie {
  padding: 0.85rem 1.2rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.lv-doc-leyenda {
  margin: 0 0 0.65rem;
  font-size: 0.88rem;
  color: var(--color-texto-suave);
}

.lv-doc-pie-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.lv-doc-btn-imprimir,
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

.lv-doc-btn-imprimir {
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
}

.lv-doc-btn-cerrar--accion {
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento);
  color: var(--color-texto-inverso, #fff);
}

.lv-doc-btn-cerrar--accion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lv-doc-pie--centro {
  text-align: center;
}

.lv-exito-cuerpo {
  padding: 1.5rem 1.25rem 0.5rem;
  text-align: center;
}

.lv-exito-ico {
  color: var(--color-exito);
}

.lv-exito-tit {
  margin: 0.75rem 0 0.35rem;
  font-size: 1.15rem;
}

.lv-exito-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-texto-suave);
}

.dev-exito-lista {
  margin: 0.5rem 0 0;
  padding-left: 1.15rem;
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-texto-suave);
}

@media (max-width: 1400px) {
  .lv-barra-filtros .pg-barra-col--reinicio {
    flex: 0 0 auto;
  }
}

.pg-wrap--cambio {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  padding-bottom: 0.75rem;
}

.pg-marco--cambio {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
