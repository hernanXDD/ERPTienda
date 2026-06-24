<script setup lang="ts">
import { Ban, Loader2, Plus, RefreshCw, ScanBarcode, Tag } from 'lucide-vue-next';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { claseChipEstadoCupon, etiquetaEstadoCupon } from '../../datos/etiquetasEstadoCupon';
import ModalVistaCupon from '../../componentes/ventas/ModalVistaCupon.vue';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { useClientesStore } from '../../stores/clientes';
import { useCuponesDescuentoStore } from '../../stores/cuponesDescuento';
import type { CuponDescuentoRegistrado, EstadoCuponDescuento, TipoDescuentoCupon } from '../../tipos/cuponDescuento';
import {
  cuponEstaVencido,
  etiquetaTipoDescuentoCupon,
  etiquetaValorDescuentoCupon,
} from '../../tipos/cuponDescuento';
import {
  formatearFechaDiaMesAnio,
} from '../../utilidades/formatoFechaHora';

const descripcionPagina = obtenerDescripcionPagina('ventas-cupones');
const route = useRoute();
const router = useRouter();
const { tienePermiso } = usePermisosOperador();
const clientesStore = useClientesStore();
const cuponesStore = useCuponesDescuentoStore();
const { cupones, cargando, creando, anulando, errorCupon } = storeToRefs(cuponesStore);
const { clientes } = storeToRefs(clientesStore);

const refCrear = useTemplateRef<HTMLDialogElement>('refCrear');
const refAnular = useTemplateRef<HTMLDialogElement>('refAnular');

const busqueda = ref('');
const filtroEstado = ref<'todos' | EstadoCuponDescuento | 'vencidos'>('todos');
const tipoDescuentoCrear = ref<TipoDescuentoCupon>('porcentaje');
const porcentajeTexto = ref('');
const montoTexto = ref('');
const fechaVencimiento = ref(fechaPorDefectoVencimiento());
const observaciones = ref('');
const clienteIdCrear = ref('');
const textoBusquedaCliente = ref('');
const desplegableClienteAbierto = ref(false);
const mensajeFormulario = ref('');
const mensajeAnular = ref('');
const motivoAnular = ref('');
const cuponAAnular = ref<CuponDescuentoRegistrado | null>(null);
const cuponAVer = ref<CuponDescuentoRegistrado | null>(null);

const puedeRegistrar = computed(() => tienePermiso('puedeRegistrarVentas'));
const fechaMinimaVencimiento = computed(() => fechaMinimaVencimientoIso());

onMounted(() => {
  void cuponesStore.cargar({ forzar: true });
  void clientesStore.cargar({ forzar: true });
  if (route.query.accion === 'crear') {
    abrirCrearCupon();
  }
  if (typeof route.query.buscar === 'string' && route.query.buscar.trim()) {
    busqueda.value = route.query.buscar.trim();
  }
});

watch(
  () => route.query.accion,
  (accion) => {
    if (accion === 'crear') abrirCrearCupon();
  },
);

const clientesSugeridos = computed(() => {
  const q = textoBusquedaCliente.value.trim().toLowerCase();
  return clientes.value
    .filter((c) => c.habilitado)
    .filter((c) => {
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);
});

const cuponesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  return cupones.value.filter((c) => {
    if (filtroEstado.value === 'vencidos') {
      if (!cuponEstaVencido(c)) return false;
    } else if (filtroEstado.value === 'activo') {
      if (c.estado !== 'activo' || cuponEstaVencido(c)) return false;
    } else if (filtroEstado.value !== 'todos' && c.estado !== filtroEstado.value) {
      return false;
    }
    if (!q) return true;
    const trozos = [
      c.id,
      c.numero,
      c.nombreClienteMostrar,
      c.documentoClienteMostrar,
      c.observaciones,
      c.numeroDevolucion,
      c.numeroVentaOrigen,
      c.numeroVentaUsada,
    ]
      .filter(Boolean)
      .map((t) => String(t).toLowerCase());
    return trozos.some((t) => t.includes(q));
  });
});

const hayFiltrosActivos = computed(
  () => Boolean(busqueda.value.trim() || filtroEstado.value !== 'todos'),
);

function fechaMinimaVencimientoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function fechaPorDefectoVencimiento(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function formatearDescuentoCupon(cupon: CuponDescuentoRegistrado): string {
  return etiquetaValorDescuentoCupon(cupon);
}

function textoOrigenCupon(cupon: CuponDescuentoRegistrado): string {
  if (cupon.numeroDevolucion && cupon.numeroVentaOrigen) {
    return `${cupon.numeroDevolucion} · Venta ${cupon.numeroVentaOrigen}`;
  }
  if (cupon.numeroDevolucion) return cupon.numeroDevolucion;
  return 'Manual';
}

function textoUsadoEnCupon(cupon: CuponDescuentoRegistrado): string {
  return cupon.numeroVentaUsada ?? '—';
}

function limpiarFiltros(): void {
  busqueda.value = '';
  filtroEstado.value = 'todos';
}

function reiniciarFormularioCrear(): void {
  tipoDescuentoCrear.value = 'porcentaje';
  porcentajeTexto.value = '';
  montoTexto.value = '';
  fechaVencimiento.value = fechaPorDefectoVencimiento();
  observaciones.value = '';
  clienteIdCrear.value = '';
  textoBusquedaCliente.value = '';
  desplegableClienteAbierto.value = false;
  mensajeFormulario.value = '';
}

let idCierreDesplegableCliente: ReturnType<typeof setTimeout> | null = null;

function alEnfocarClienteCrear(): void {
  if (idCierreDesplegableCliente) {
    clearTimeout(idCierreDesplegableCliente);
    idCierreDesplegableCliente = null;
  }
  desplegableClienteAbierto.value = true;
}

function alDesenfocarClienteCrear(): void {
  idCierreDesplegableCliente = setTimeout(() => {
    desplegableClienteAbierto.value = false;
  }, 200);
}

function alEscribirBusquedaClienteCrear(): void {
  desplegableClienteAbierto.value = true;
  if (!clienteIdCrear.value) return;
  const c = clientesStore.clientePorId(clienteIdCrear.value);
  if (!c) {
    clienteIdCrear.value = '';
    return;
  }
  const texto = textoBusquedaCliente.value.trim().toLowerCase();
  if (!texto) {
    clienteIdCrear.value = '';
    return;
  }
  const coincide =
    texto === c.nombre.trim().toLowerCase() ||
    c.documento.toLowerCase().includes(texto) ||
    c.nombre.toLowerCase().includes(texto);
  if (!coincide) {
    clienteIdCrear.value = '';
  }
}

function seleccionarClienteCrear(id: string): void {
  const c = clientesStore.clientePorId(id);
  if (!c) return;
  if (idCierreDesplegableCliente) {
    clearTimeout(idCierreDesplegableCliente);
    idCierreDesplegableCliente = null;
  }
  clienteIdCrear.value = id;
  textoBusquedaCliente.value = c.nombre;
  desplegableClienteAbierto.value = false;
}

function quitarClienteCrear(): void {
  clienteIdCrear.value = '';
  textoBusquedaCliente.value = '';
}

function abrirCrearCupon(): void {
  reiniciarFormularioCrear();
  refCrear.value?.showModal();
}

function cerrarCrearCupon(): void {
  refCrear.value?.close();
  if (route.query.accion) {
    void router.replace({ name: 'ventas-cupones' });
  }
}

function alCerrarCrearCupon(): void {
  if (route.query.accion) {
    void router.replace({ name: 'ventas-cupones' });
  }
}

async function confirmarCrearCupon(): Promise<void> {
  mensajeFormulario.value = '';

  let porcentajeDescuento: number | undefined;
  let montoDescuento: number | undefined;

  if (tipoDescuentoCrear.value === 'porcentaje') {
    const porcentaje = Number(porcentajeTexto.value.replace(',', '.'));
    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      mensajeFormulario.value = 'Ingresá un porcentaje entre 0,01 y 100.';
      return;
    }
    porcentajeDescuento = porcentaje;
  } else {
    const monto = Number(montoTexto.value.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(monto) || monto <= 0) {
      mensajeFormulario.value = 'Ingresá un monto de descuento mayor a cero en pesos.';
      return;
    }
    montoDescuento = monto;
  }

  if (!fechaVencimiento.value) {
    mensajeFormulario.value = 'Seleccioná una fecha de vencimiento.';
    return;
  }

  try {
    const cliente = clienteIdCrear.value ? clientesStore.clientePorId(clienteIdCrear.value) : null;
    const cupon = await cuponesStore.crear({
      tipoDescuento: tipoDescuentoCrear.value,
      porcentajeDescuento,
      montoDescuento,
      fechaVencimiento: `${fechaVencimiento.value}T23:59:59`,
      observaciones: observaciones.value,
      clienteId: cliente?.id ?? null,
      nombreClienteMostrar: cliente?.nombre,
      documentoClienteMostrar: cliente?.documento,
    });
    cerrarCrearCupon();
    abrirVerCupon(cupon);
  } catch {
    mensajeFormulario.value = errorCupon.value ?? 'No se pudo crear el cupón. Revisá los datos e intentá de nuevo.';
  }
}

function abrirVerCupon(cupon: CuponDescuentoRegistrado): void {
  cuponAVer.value = cupon;
}

function cerrarVerCupon(): void {
  cuponAVer.value = null;
}

function abrirAnularCupon(cupon: CuponDescuentoRegistrado): void {
  cuponAAnular.value = cupon;
  motivoAnular.value = '';
  mensajeAnular.value = '';
  refAnular.value?.showModal();
}

function cerrarAnularCupon(): void {
  refAnular.value?.close();
  cuponAAnular.value = null;
  motivoAnular.value = '';
  mensajeAnular.value = '';
}

async function confirmarAnularCupon(): Promise<void> {
  if (!cuponAAnular.value) return;
  mensajeAnular.value = '';
  try {
    await cuponesStore.anular(cuponAAnular.value.id, motivoAnular.value);
    cerrarAnularCupon();
  } catch {
    mensajeAnular.value = errorCupon.value ?? 'No se pudo anular el cupón. Intentá de nuevo.';
  }
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-cupones">
    <div class="pg-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Tag :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Ventas · Postventa</p>
              <h1 id="titulo-cupones" class="pg-titulo">Cupones</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>

        <div class="cup-cab-acciones">
          <button
            type="button"
            class="pg-btn-primario cup-btn-nuevo"
            :disabled="!puedeRegistrar"
            @click="abrirCrearCupon"
          >
            <Plus :size="16" aria-hidden="true" />
            Nuevo cupón
          </button>
        </div>
      </header>

      <p v-if="!puedeRegistrar" class="cup-banner-lectura" role="status">
        Tenés acceso de lectura. Para emitir cupones necesitás permiso para registrar ventas.
      </p>

      <div class="pg-barra lv-barra-filtros cup-barra-filtros">
        <div class="pg-barra-col pg-barra-col--busq">
          <label class="pg-filtro-bl" for="cup-busq">
            <span class="pg-filtro-etiq">Buscar cupón</span>
            <input
              id="cup-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Número, cliente, devolución o venta…"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--filtro">
          <label class="pg-filtro-bl" for="cup-estado">
            <span class="pg-filtro-etiq">Estado</span>
            <select id="cup-estado" v-model="filtroEstado" class="pg-filtro-inp pg-filtro-sel">
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="vencidos">Vencidos</option>
              <option value="usado">Usados</option>
              <option value="anulado">Anulados</option>
            </select>
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

      <p v-if="errorCupon" class="lv-alerta-carga" role="alert">
        {{ errorCupon }}
        <button type="button" class="lv-alerta-reintentar" @click="cuponesStore.cargar({ forzar: true })">
          Reintentar
        </button>
      </p>

      <p v-else-if="cargando && cupones.length === 0" class="lv-cargando" role="status">
        <Loader2 :size="18" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
        Cargando cupones desde el servidor…
      </p>

      <p class="pg-resumen" role="status">
        Mostrando <strong>{{ cuponesFiltrados.length }}</strong>
        {{ cuponesFiltrados.length === 1 ? 'cupón' : 'cupones' }}
      </p>

      <div class="cup-contenedor" role="region" aria-label="Listado de cupones">
        <div v-if="cuponesFiltrados.length > 0" class="cup-scroll">
          <div class="cup-grid" role="list" aria-label="Cupones registrados">
            <article
              v-for="c in cuponesFiltrados"
              :key="c.id"
              class="cup-card"
              role="listitem"
            >
              <header class="cup-card-cab">
                <div class="cup-card-ids">
                  <span class="cup-id lv-mono">{{ c.id }}</span>
                  <span class="cup-num lv-num">{{ c.numero }}</span>
                </div>
                <time
                  class="cup-card-vence"
                  :class="{ 'cup-card-vence--vencido': cuponEstaVencido(c) }"
                  :datetime="c.fechaVencimiento"
                >
                  {{ formatearFechaDiaMesAnio(c.fechaVencimiento) }}
                </time>
              </header>

              <div class="cup-card-desc">
                <strong class="cup-card-desc-val">{{ formatearDescuentoCupon(c) }}</strong>
                <span class="cup-card-desc-tipo">{{ etiquetaTipoDescuentoCupon(c.tipoDescuento) }}</span>
              </div>

              <p class="cup-card-cli" :class="{ 'lv-cli--cf': !c.clienteId }">
                {{ c.nombreClienteMostrar }}
              </p>

              <div class="cup-card-chips">
                <span :class="claseChipEstadoCupon(c.estado, c)">{{ etiquetaEstadoCupon(c.estado, c) }}</span>
                <span v-if="cuponEstaVencido(c)" class="sr-only">Vencido</span>
              </div>

              <dl class="cup-card-meta">
                <div class="cup-card-meta-item">
                  <dt>Origen</dt>
                  <dd class="lv-mono">{{ textoOrigenCupon(c) }}</dd>
                </div>
                <div class="cup-card-meta-item">
                  <dt>Usado en</dt>
                  <dd class="lv-mono">{{ textoUsadoEnCupon(c) }}</dd>
                </div>
              </dl>

              <footer class="cup-card-pie">
                <button
                  type="button"
                  class="cup-det"
                  :aria-label="`Ver cupón ${c.numero}`"
                  @click="abrirVerCupon(c)"
                >
                  <ScanBarcode :size="15" stroke-width="2" aria-hidden="true" />
                  Ver cupón
                </button>
                <button
                  v-if="c.estado === 'activo' && !cuponEstaVencido(c)"
                  type="button"
                  class="cup-det cup-det--anular"
                  :disabled="!puedeRegistrar || anulando"
                  @click="abrirAnularCupon(c)"
                >
                  <Ban :size="15" stroke-width="2" aria-hidden="true" />
                  Anular
                </button>
              </footer>
            </article>
          </div>
        </div>

        <p v-else class="cup-vacio" role="status">
          No hay cupones con los filtros actuales. Creá uno con «Nuevo cupón».
        </p>
      </div>
    </div>

    <dialog ref="refCrear" class="cup-modal" aria-labelledby="cup-crear-titulo" @close="alCerrarCrearCupon">
      <form class="cup-modal-doc" @submit.prevent="confirmarCrearCupon">
        <header class="cup-modal-cab">
          <h2 id="cup-crear-titulo" class="cup-modal-tit">Nuevo cupón</h2>
        </header>
        <div class="cup-modal-cuerpo">
          <fieldset class="cup-tipo-fs">
            <legend class="pg-filtro-etiq">Tipo de descuento</legend>
            <div class="cup-tipo-opciones" role="radiogroup" aria-label="Tipo de descuento del cupón">
              <label class="cup-tipo-opc">
                <input v-model="tipoDescuentoCrear" type="radio" name="cup-tipo" value="porcentaje" />
                <span>Porcentaje (%)</span>
              </label>
              <label class="cup-tipo-opc">
                <input v-model="tipoDescuentoCrear" type="radio" name="cup-tipo" value="monto_fijo" />
                <span>Monto fijo ($)</span>
              </label>
            </div>
          </fieldset>

          <label v-if="tipoDescuentoCrear === 'porcentaje'" class="pg-filtro-bl" for="cup-porcentaje">
            <span class="pg-filtro-etiq">Porcentaje de descuento</span>
            <div class="cup-inp-pct">
              <input
                id="cup-porcentaje"
                v-model="porcentajeTexto"
                type="text"
                inputmode="decimal"
                class="pg-filtro-inp"
                placeholder="Ej. 15"
                autocomplete="off"
                required
              />
              <span class="cup-inp-suf" aria-hidden="true">%</span>
            </div>
          </label>

          <label v-else class="pg-filtro-bl" for="cup-monto">
            <span class="pg-filtro-etiq">Monto de descuento</span>
            <div class="cup-inp-pct">
              <span class="cup-inp-pre" aria-hidden="true">$</span>
              <input
                id="cup-monto"
                v-model="montoTexto"
                type="text"
                inputmode="numeric"
                class="pg-filtro-inp cup-inp-monto"
                placeholder="Ej. 10000"
                autocomplete="off"
                required
              />
            </div>
          </label>

          <label class="pg-filtro-bl" for="cup-vencimiento">
            <span class="pg-filtro-etiq">Fecha de vencimiento</span>
            <input
              id="cup-vencimiento"
              v-model="fechaVencimiento"
              type="date"
              class="pg-filtro-inp"
              :min="fechaMinimaVencimiento"
              required
            />
          </label>

          <div class="cup-campo-cliente">
            <label class="pg-filtro-bl" for="cup-cliente">
              <span class="pg-filtro-etiq">Cliente (opcional)</span>
              <div class="cup-combo">
                <input
                  id="cup-cliente"
                  v-model="textoBusquedaCliente"
                  type="text"
                  class="pg-filtro-inp"
                  placeholder="Buscar por nombre o documento…"
                  autocomplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="cup-lista-clientes"
                  :aria-expanded="desplegableClienteAbierto"
                  @focus="alEnfocarClienteCrear"
                  @blur="alDesenfocarClienteCrear"
                  @input="alEscribirBusquedaClienteCrear"
                />
                <button
                  v-if="clienteIdCrear"
                  type="button"
                  class="cup-quitar-cli"
                  @click="quitarClienteCrear"
                >
                  Quitar
                </button>
                <ul
                  v-show="desplegableClienteAbierto"
                  id="cup-lista-clientes"
                  class="cup-combo-lista"
                  role="listbox"
                  aria-label="Clientes sugeridos"
                  @mousedown.prevent
                >
                  <li v-for="c in clientesSugeridos" :key="c.id" role="presentation">
                    <button
                      type="button"
                      class="cup-combo-opc"
                      :class="{ 'cup-combo-opc--on': clienteIdCrear === c.id }"
                      role="option"
                      :aria-selected="clienteIdCrear === c.id"
                      @pointerdown.prevent.stop="seleccionarClienteCrear(c.id)"
                      @click.prevent.stop="seleccionarClienteCrear(c.id)"
                    >
                      <span class="cup-combo-opc-nom">{{ c.nombre }}</span>
                      <span class="cup-combo-opc-det">{{ c.documento }}</span>
                    </button>
                  </li>
                  <li
                    v-if="clientesSugeridos.length === 0"
                    class="cup-combo-vacio"
                    role="presentation"
                  >
                    Sin coincidencias
                  </li>
                </ul>
              </div>
            </label>
            <p class="cup-cli-ayuda">
              Si asignás un cliente, solo podrá usar el cupón ese receptor en el centro de ventas.
            </p>
          </div>

          <label class="pg-filtro-bl" for="cup-obs">
            <span class="pg-filtro-etiq">Observaciones (opcional)</span>
            <textarea
              id="cup-obs"
              v-model="observaciones"
              class="pg-filtro-inp cup-obs-inp"
              rows="2"
              maxlength="1000"
            />
          </label>

          <p v-if="mensajeFormulario" class="lv-alerta-carga cup-alerta-inline" role="alert">
            {{ mensajeFormulario }}
          </p>
        </div>
        <footer class="cup-modal-pie">
          <button type="button" class="cup-btn-sec" @click="cerrarCrearCupon">Cancelar</button>
          <button type="submit" class="pg-btn-primario" :disabled="creando || !puedeRegistrar">
            <Loader2 v-if="creando" :size="16" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
            Crear cupón
          </button>
        </footer>
      </form>
    </dialog>

    <dialog ref="refAnular" class="cup-modal" aria-labelledby="cup-anular-titulo">
      <form v-if="cuponAAnular" class="cup-modal-doc" @submit.prevent="confirmarAnularCupon">
        <header class="cup-modal-cab">
          <h2 id="cup-anular-titulo" class="cup-modal-tit">Anular cupón</h2>
          <p class="cup-modal-sub">
            Cupón <strong>{{ cuponAAnular.numero }}</strong>
            · {{ formatearDescuentoCupon(cuponAAnular) }}
          </p>
        </header>
        <div class="cup-modal-cuerpo">
          <p class="cup-anular-aviso">
            El cupón dejará de poder escanearse. Esta acción no se puede deshacer.
          </p>
          <label class="pg-filtro-bl" for="cup-motivo-anular">
            <span class="pg-filtro-etiq">Motivo (opcional)</span>
            <textarea
              id="cup-motivo-anular"
              v-model="motivoAnular"
              class="pg-filtro-inp cup-obs-inp"
              rows="2"
              maxlength="500"
              placeholder="Ej. emitido por error"
            />
          </label>
          <p v-if="mensajeAnular" class="lv-alerta-carga cup-alerta-inline" role="alert">
            {{ mensajeAnular }}
          </p>
        </div>
        <footer class="cup-modal-pie">
          <button type="button" class="cup-btn-sec" @click="cerrarAnularCupon">Cancelar</button>
          <button type="submit" class="cup-btn-anular-submit" :disabled="anulando || !puedeRegistrar">
            <Loader2 v-if="anulando" :size="16" class="lv-btn-cargar-fact-ico--girar" aria-hidden="true" />
            Confirmar anulación
          </button>
        </footer>
      </form>
    </dialog>

    <ModalVistaCupon
      v-if="cuponAVer"
      :cupon="cuponAVer"
      @cerrar="cerrarVerCupon"
    />
  </section>
</template>

<style scoped>
.cup-barra-filtros {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(11rem, 13.5rem) auto;
  align-items: end;
  gap: 0.65rem 1rem;
}

.cup-barra-filtros .pg-barra-col--busq,
.cup-barra-filtros .pg-barra-col--filtro,
.cup-barra-filtros .pg-barra-col--reinicio {
  flex: unset;
  min-width: 0;
}

.cup-barra-filtros .pg-barra-col--reinicio {
  margin-left: 0;
}

.cup-barra-filtros .pg-filtro-bl {
  width: 100%;
}

@media (max-width: 720px) {
  .cup-barra-filtros {
    grid-template-columns: minmax(0, 1fr);
  }

  .cup-barra-filtros .pg-barra-col--reinicio {
    grid-column: 1;
  }
}

.cup-contenedor {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 1.25rem;
}

.cup-scroll {
  --cup-grid-columnas: 4;
  --cup-grid-filas-visibles: 3;
  --cup-grid-gap: 0.75rem;
  --cup-altura-card: 12.5rem;
  --cup-scroll-padding: 0.75rem;

  max-height: calc(
    var(--cup-grid-filas-visibles) * var(--cup-altura-card) +
      (var(--cup-grid-filas-visibles) - 1) * var(--cup-grid-gap) + 2 * var(--cup-scroll-padding)
  );
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--cup-scroll-padding);
  border-radius: 14px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  scrollbar-gutter: stable;
}

.cup-grid {
  display: grid;
  grid-template-columns: repeat(var(--cup-grid-columnas), minmax(0, 1fr));
  gap: var(--cup-grid-gap);
}

.cup-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-height: var(--cup-altura-card);
  padding: 0.85rem 0.95rem;
  border-radius: 14px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.cup-card:hover {
  border-color: var(--color-acento-borde);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.cup-card-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.cup-card-ids {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.cup-card-vence {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  font-variant-numeric: tabular-nums;
}

.cup-card-vence--vencido {
  color: var(--color-advertencia);
}

.cup-card-desc {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.cup-card-desc-val {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-acento-hover);
  font-variant-numeric: tabular-nums;
}

.cup-card-desc-tipo {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
}

.cup-card-cli {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cup-card-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.cup-card-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 0.65rem;
  margin: 0;
  flex: 1;
}

.cup-card-meta-item {
  min-width: 0;
}

.cup-card-meta-item dt {
  margin: 0 0 0.08rem;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-texto-apagado);
}

.cup-card-meta-item dd {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.35;
  color: var(--color-texto-suave);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cup-card-pie {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding-top: 0.5rem;
  margin-top: auto;
  border-top: 1px solid var(--color-borde);
}

.cup-vacio {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  line-height: 1.5;
  border-radius: 14px;
  border: 1px dashed var(--color-borde);
  background: var(--color-fondo-cabecera);
}

@media (max-width: 1280px) {
  .cup-scroll {
    --cup-grid-columnas: 3;
  }
}

@media (max-width: 960px) {
  .cup-scroll {
    --cup-grid-columnas: 2;
    --cup-altura-card: 12rem;
  }
}

@media (max-width: 560px) {
  .cup-scroll {
    --cup-grid-columnas: 1;
    --cup-grid-filas-visibles: 4;
    --cup-altura-card: auto;
  }

  .cup-card-meta-item dd {
    white-space: normal;
  }
}

.cup-cab-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-self: end;
}

.cup-btn-nuevo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.cup-banner-lectura {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px dashed var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-suave);
  font-size: 0.84rem;
  line-height: 1.45;
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

.cup-alerta-inline {
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
  animation: cup-girar 0.8s linear infinite;
}

@keyframes cup-girar {
  to {
    transform: rotate(360deg);
  }
}

.cup-id {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-texto);
  background: var(--color-fondo-cabecera);
  border: 1px solid var(--color-borde);
}

.cup-num {
  font-size: 0.82rem;
  font-weight: 650;
}

.lv-cli--cf {
  color: var(--color-texto-suave);
  font-style: italic;
}

.lv-mono {
  font-variant-numeric: tabular-nums;
}

.cup-chip {
  display: inline-block;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.3;
  border: 1px solid transparent;
  white-space: nowrap;
}

.cup-chip--activo {
  color: var(--color-exito);
  background: var(--color-exito-suave);
  border-color: var(--color-exito-borde);
}

.cup-chip--usado {
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  border-color: var(--color-borde);
}

.cup-chip--anulado {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border-color: var(--color-peligro-borde);
}

.cup-chip--vencido {
  margin-left: 0.25rem;
  color: var(--color-advertencia);
  background: var(--color-advertencia-suave);
  border-color: var(--color-advertencia-borde);
}

.cup-det {
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
  font-family: inherit;
}

.cup-det:hover:not(:disabled) {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.cup-det:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cup-det--anular {
  color: var(--color-peligro);
  border-color: var(--color-peligro-borde);
  background: var(--color-peligro-suave);
}

.cup-campo-cliente {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cup-combo {
  position: relative;
  display: flex;
  gap: 0.35rem;
  align-items: stretch;
}

.cup-combo > input {
  flex: 1;
}

.cup-quitar-cli {
  flex-shrink: 0;
  padding: 0 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-suave);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.cup-combo-lista {
  position: absolute;
  z-index: 5;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  max-height: 12rem;
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.cup-combo-opc {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.45rem 0.55rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.cup-combo-opc:hover,
.cup-combo-opc--on {
  background: var(--color-acento-suave);
}

.cup-combo-opc-nom {
  font-size: 0.84rem;
  font-weight: 600;
}

.cup-combo-opc-det {
  font-size: 0.74rem;
  color: var(--color-texto-apagado);
}

.cup-combo-vacio {
  padding: 0.55rem;
  font-size: 0.82rem;
  color: var(--color-texto-apagado);
}

.cup-cli-ayuda {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.cup-anular-aviso {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--color-texto-suave);
}

.cup-btn-anular-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-peligro-borde);
  background: var(--color-peligro);
  color: var(--color-texto-inverso, #fff);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.cup-btn-anular-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cup-modal {
  margin: auto;
  padding: 0;
  width: min(28rem, calc(100vw - 1.25rem));
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--color-texto);
}

.cup-modal::backdrop {
  background: var(--color-scrim);
  backdrop-filter: blur(4px);
}

.cup-modal-doc {
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
}

.cup-modal-cab {
  padding: 1rem 1.2rem 0.75rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cup-modal-tit {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.cup-modal-sub {
  margin: 0.35rem 0 0;
  font-size: 0.84rem;
  color: var(--color-texto-suave);
}

.cup-modal-cuerpo {
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.cup-modal-meta {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
  text-align: center;
}

.cup-modal-pie {
  padding: 0.85rem 1.2rem 1rem;
  border-top: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cup-btn-sec {
  padding: 0.5rem 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.cup-tarjeta-tipo {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
}

.cup-tipo-det {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
}

.cup-tipo-fs {
  margin: 0 0 0.85rem;
  padding: 0;
  border: none;
}

.cup-tipo-opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.cup-tipo-opc {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  font-size: 0.82rem;
  cursor: pointer;
}

.cup-tipo-opc:has(input:checked) {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.cup-inp-pre {
  display: flex;
  align-items: center;
  padding: 0 0.65rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-elevado);
  border-right: 1px solid var(--color-borde);
}

.cup-inp-monto {
  flex: 1;
}

.cup-inp-pct {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  overflow: hidden;
  background: var(--color-fondo-cabecera);
}

.cup-inp-pct:focus-within {
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 2px var(--color-acento-suave);
}

.cup-inp-pct input {
  border: none;
  box-shadow: none;
}

.cup-inp-suf {
  display: flex;
  align-items: center;
  padding: 0 0.65rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  background: var(--color-fondo-elevado);
  border-left: 1px solid var(--color-borde);
}

.cup-obs-inp {
  resize: vertical;
  min-height: 2.5rem;
}
</style>
