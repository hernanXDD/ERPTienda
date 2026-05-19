<script setup lang="ts">
import {
  CheckCircle2,
  Minus,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
} from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { FORMAS_PAGO } from '../../datos/formasPago';
import { useCatalogoStore } from '../../stores/catalogo';
import { useClientesStore } from '../../stores/clientes';
import { useStockStore } from '../../stores/stock';
import { useVentasStore } from '../../stores/ventas';
import type { Producto } from '../../tipos/catalogo';
import type { Cliente } from '../../tipos/cliente';
import type { IdFormaPago } from '../../tipos/venta';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

interface LineaTicket {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

const emit = defineEmits<{ cerrar: [] }>();

const catalogo = useCatalogoStore();
const clientesStore = useClientesStore();
const ventasStore = useVentasStore();
const stockStore = useStockStore();
const { productos } = storeToRefs(catalogo);
const { clientes } = storeToRefs(clientesStore);

type ModoProducto = 'LECTOR' | 'NOMBRE';

const refInputLector = useTemplateRef<HTMLInputElement>('refInputLector');
const refInputNombre = useTemplateRef<HTMLInputElement>('refInputNombre');
const modoProducto = ref<ModoProducto>('LECTOR');
const codigoLector = ref('');
const busquedaNombre = ref('');
const productoSeleccionadoId = ref<string | null>(null);
const filtroClienteTexto = ref('');
const lineas = ref<LineaTicket[]>([]);
const clienteId = ref('');
const formaPago = ref<IdFormaPago>('EFECTIVO');
const observaciones = ref('');
const mensajeToast = ref('');
let idToast: ReturnType<typeof setTimeout> | null = null;

function mostrarToast(texto: string, duracion = 3200) {
  mensajeToast.value = texto;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, duracion);
}

function normalizarCodigoBarras(c: string): string {
  return c.trim();
}

function coincideBusqueda(producto: Producto, texto: string): boolean {
  const q = texto.trim().toLowerCase();
  if (!q) return false;
  const trozos = [
    producto.nombre,
    producto.marca,
    producto.tipoPrenda,
    producto.descripcion,
    producto.codigoBarras,
  ].map((x) => x.toLowerCase());
  return trozos.some((t) => t.includes(q));
}

const resultadosProducto = computed(() => {
  const q = busquedaNombre.value.trim();
  if (!q) return [];
  return [...productos.value]
    .filter((p) => coincideBusqueda(p, q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
});

const productoNombreSeleccionado = computed(
  () =>
    (productoSeleccionadoId.value
      ? productos.value.find((p) => p.id === productoSeleccionadoId.value)
      : null) ?? null
);

const clientesFiltrados = computed(() => {
  const base = clientes.value.filter((c) => c.habilitado);
  const q = filtroClienteTexto.value.trim().toLowerCase();
  if (!q) return base;
  return base.filter(
    (c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.documento.toLowerCase().includes(q) ||
      c.correoElectronico.toLowerCase().includes(q) ||
      c.telefonoPrincipal.toLowerCase().includes(q) ||
      c.telefonoAlternativo.toLowerCase().includes(q) ||
      c.direccion.toLowerCase().includes(q)
  );
});

function etiquetaClienteSelectorVenta(c: Cliente): string {
  const correo = c.correoElectronico.trim();
  return correo
    ? `${c.nombre} — ${c.documento} — ${correo}`
    : `${c.nombre} — ${c.documento}`;
}

const totalTicket = computed(() =>
  lineas.value.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)
);

const ahoraEmision = ref(new Date());
const fechaLegible = computed(() => formatearFechaYHora(ahoraEmision.value));
const fechaIso = computed(() => ahoraEmision.value.toISOString());

const nombreClienteMostrar = computed(() => {
  if (!clienteId.value) return 'Consumidor final';
  return clientesStore.clientePorId(clienteId.value)?.nombre ?? 'Consumidor final';
});

const puedeCuentaCorriente = computed(() => {
  if (!clienteId.value) return false;
  const c = clientesStore.clientePorId(clienteId.value);
  if (!c?.habilitado) return false;
  return c.cuentaCorrienteHabilitada === true;
});

watch(clienteId, () => {
  if (formaPago.value === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente.value) {
    formaPago.value = 'EFECTIVO';
  }
});

watch(busquedaNombre, () => {
  productoSeleccionadoId.value = null;
});

watch(modoProducto, () => {
  nextTick(() => enfocarModoActual());
});

function enfocarModoActual() {
  nextTick(() => {
    if (modoProducto.value === 'LECTOR') {
      refInputLector.value?.focus();
      refInputLector.value?.select?.();
    } else {
      refInputNombre.value?.focus();
    }
  });
}

function agregarPorLector() {
  const codigoNorm = normalizarCodigoBarras(codigoLector.value);
  if (!codigoNorm) {
    mostrarToast('Ingresá el código del lector o escribilo y presioná Enter.', 3200);
    return;
  }
  const producto = productos.value.find(
    (p) =>
      Boolean(p.codigoBarras) && normalizarCodigoBarras(p.codigoBarras) === codigoNorm
  );
  if (!producto) {
    mostrarToast('No hay ningún producto con ese código.', 3800);
    return;
  }
  agregarAlTicket(producto);
  codigoLector.value = '';
  enfocarModoActual();
}

function seleccionarProductoNombre(producto: Producto) {
  productoSeleccionadoId.value = producto.id;
}

function agregarProductoNombreSeleccionado() {
  const p = productoNombreSeleccionado.value;
  if (!p) {
    mostrarToast('Seleccioná un producto en la lista.', 3500);
    return;
  }
  agregarAlTicket(p);
  productoSeleccionadoId.value = null;
}

function setModoProducto(m: ModoProducto) {
  modoProducto.value = m;
}

function resetBorrador() {
  codigoLector.value = '';
  busquedaNombre.value = '';
  productoSeleccionadoId.value = null;
  modoProducto.value = 'LECTOR';
  filtroClienteTexto.value = '';
  lineas.value = [];
  clienteId.value = '';
  formaPago.value = 'EFECTIVO';
  observaciones.value = '';
}

function pedirLimpiar() {
  if (
    lineas.value.length > 0 &&
    !globalThis.confirm('¿Descartar los datos cargados en esta venta?')
  ) {
    return;
  }
  resetBorrador();
  nextTick(() => enfocarModoActual());
}

function agregarAlTicket(producto: Producto) {
  if (!Number.isFinite(producto.precioVenta) || producto.precioVenta < 0) {
    mostrarToast('El producto no tiene precio de venta válido.', 4000);
    return;
  }
  const existente = lineas.value.find((l) => l.productoId === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    lineas.value = [
      ...lineas.value,
      {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
      },
    ];
  }
}

function quitarLinea(productoId: string) {
  lineas.value = lineas.value.filter((l) => l.productoId !== productoId);
}

function cambiarCantidad(productoId: string, delta: number) {
  const l = lineas.value.find((x) => x.productoId === productoId);
  if (!l) return;
  const nueva = l.cantidad + delta;
  if (nueva <= 0) {
    quitarLinea(productoId);
    return;
  }
  l.cantidad = nueva;
}

function vaciarLineas() {
  if (lineas.value.length === 0) return;
  if (!globalThis.confirm('¿Quitar todos los productos de la venta?')) return;
  lineas.value = [];
  enfocarModoActual();
}

function subtotalLinea(l: LineaTicket): number {
  return l.cantidad * l.precioUnitario;
}

const puedeConfirmarVenta = computed(
  () => lineas.value.length > 0 && (formaPago.value !== 'CUENTA_CORRIENTE' || puedeCuentaCorriente.value)
);

function confirmarVenta() {
  if (lineas.value.length === 0) {
    mostrarToast('Agregá al menos un producto en el cuerpo de la venta.', 4000);
    return;
  }
  if (formaPago.value === 'CUENTA_CORRIENTE') {
    if (!clienteId.value) {
      mostrarToast('Para cuenta corriente tenés que elegir un cliente con crédito habilitado.', 4000);
      return;
    }
    if (!puedeCuentaCorriente.value) {
      mostrarToast('Ese cliente no tiene cuenta corriente.', 4000);
      formaPago.value = 'EFECTIVO';
      return;
    }
  }

  const lineasRegistro = lineas.value.map((l) => ({
    productoId: l.productoId,
    nombre: l.nombre,
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitario,
    subtotal: l.cantidad * l.precioUnitario,
  }));

  const problemaStock = stockStore.validacionAntesDeVenta(lineasRegistro);
  if (problemaStock) {
    const resumen = problemaStock
      .map((f) => `${f.nombre}: necesitás ${f.solicitado}, disponible ${f.disponible}`)
      .slice(0, 3)
      .join('. ');
    mostrarToast(
      `Hay productos sin stock suficiente. ${resumen}${problemaStock.length > 3 ? '…' : ''}`,
      6200
    );
    return;
  }

  const registrada = ventasStore.registrarVenta({
    clienteId: clienteId.value || null,
    nombreClienteMostrar: nombreClienteMostrar.value,
    formaPago: formaPago.value,
    total: totalTicket.value,
    lineas: lineasRegistro,
    observaciones: observaciones.value,
  });

  stockStore.aplicarSalidaPorVentaRegistrada(
    lineasRegistro,
    registrada.id,
    registrada.numero
  );

  mostrarToast('Venta registrada.', 2800);
  emit('cerrar');
}

onMounted(() => {
  resetBorrador();
  nextTick(() => enfocarModoActual());
});
</script>

<template>
  <section class="ev ev--en-modal ev-pro" aria-labelledby="titulo-nueva">
    <header class="ev-cab ev-cab--nueva">
      <button type="button" class="ev-volver" @click="emit('cerrar')">← Ventas</button>
      <span class="ev-cab-fill" />
      <button type="button" class="ev-btn-otra" @click="pedirLimpiar">Limpiar</button>
      <button
        type="button"
        class="ev-btn-confirmar ev-btn-confirmar--cab"
        :disabled="!puedeConfirmarVenta"
        @click="confirmarVenta"
      >
        <CheckCircle2 :size="18" stroke-width="2" aria-hidden="true" />
        Confirmar
      </button>
    </header>

    <Transition name="ev-toast">
      <div v-if="mensajeToast" class="ev-toast" role="status">{{ mensajeToast }}</div>
    </Transition>

    <div class="ev-flujo">
      <article class="ev-fact" aria-labelledby="titulo-nueva">
        <header class="ev-fact-enc">
          <div class="ev-fact-enc-izq">
            <p class="ev-fact-tipo" aria-hidden="true">FACTURA DE VENTA</p>
            <h1 class="ev-fact-titulo" id="titulo-nueva">Nueva venta</h1>
            <p class="ev-fact-ley">Documento interno — no válido como comprobante fiscal</p>
          </div>
          <div class="ev-fact-enc-der">
            <div class="ev-fact-punto">
              <span class="ev-fact-punto-lbl">Emisión</span>
              <time class="ev-fact-punto-val" :datetime="fechaIso">{{ fechaLegible }}</time>
            </div>
          </div>
        </header>

        <section class="ev-fac-bloq" aria-labelledby="fac-lbl-cli">
          <h2 id="fac-lbl-cli" class="ev-fac-bloq-tit">Datos del receptor</h2>
          <div class="ev-fac-cli">
            <div class="ev-fac-cli-tools">
              <div class="ev-fac-cli-fld ev-fac-cli-fld--busq">
                <label class="ev-fac-cli-eti" for="filtro-cliente">Buscar en agenda</label>
                <input
                  id="filtro-cliente"
                  v-model="filtroClienteTexto"
                  type="search"
                  class="ev-inp ev-inp--fac"
                  placeholder="Nombre, documento o teléfono…"
                  autocomplete="off"
                />
              </div>
              <div class="ev-fac-cli-fld ev-fac-cli-fld--sel">
                <label class="ev-fac-cli-eti" for="sel-cliente">Cliente registrado</label>
                <select id="sel-cliente" v-model="clienteId" class="ev-inp ev-sel ev-inp--fac">
                  <option value="">Sin especificar (consumidor final)</option>
                  <option v-for="c in clientesFiltrados" :key="c.id" :value="c.id">
                    {{ etiquetaClienteSelectorVenta(c) }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section class="ev-fac-bloq ev-fac-bloq--pago" aria-labelledby="lbl-pago">
          <h2 id="lbl-pago" class="ev-fac-bloq-tit">Forma de pago</h2>
          <div class="ev-fac-pago-fila">
            <label class="ev-fac-cli-eti" for="sel-forma-pago">Condición de venta</label>
            <select
              id="sel-forma-pago"
              v-model="formaPago"
              class="ev-inp ev-sel ev-inp--fac ev-fac-pago-select"
            >
              <option
                v-for="fp in FORMAS_PAGO"
                :key="fp.id"
                :value="fp.id"
                :disabled="fp.id === 'CUENTA_CORRIENTE' && !puedeCuentaCorriente"
              >
                {{ fp.etiqueta }}
              </option>
            </select>
          </div>
          <p v-if="!puedeCuentaCorriente" class="ev-fac-pago-hint">
            Cuenta corriente solo con cliente de crédito habilitado.
          </p>
        </section>

        <section class="ev-fac-bloq ev-fac-bloq--stretch" aria-labelledby="lbl-detalle">
          <h2 id="lbl-detalle" class="ev-fac-bloq-tit">Detalle de ítems</h2>

          <div class="ev-fac-agre">
            <span class="ev-fac-agre-lbl">Ingreso de artículos</span>
            <div class="ev-modo-seg" role="radiogroup" aria-label="Modo de ingreso">
              <button
                type="button"
                role="radio"
                class="ev-modo-seg-btn"
                :class="{ 'ev-modo-seg-btn--on': modoProducto === 'LECTOR' }"
                :aria-checked="modoProducto === 'LECTOR'"
                @click="setModoProducto('LECTOR')"
              >
                <ScanBarcode :size="17" stroke-width="2" class="ev-modo-ico" aria-hidden="true" />
                Lector
              </button>
              <button
                type="button"
                role="radio"
                class="ev-modo-seg-btn"
                :class="{ 'ev-modo-seg-btn--on': modoProducto === 'NOMBRE' }"
                :aria-checked="modoProducto === 'NOMBRE'"
                @click="setModoProducto('NOMBRE')"
              >
                <Search :size="17" stroke-width="2" class="ev-modo-ico" aria-hidden="true" />
                Nombre
              </button>
            </div>
          </div>

          <div v-show="modoProducto === 'LECTOR'" class="ev-panel-prod">
            <label class="ev-etq" for="inp-lector">Código de barras</label>
            <input
              id="inp-lector"
              ref="refInputLector"
              v-model="codigoLector"
              type="text"
              class="ev-inp ev-inp--lector ev-inp--fac"
              placeholder="Escanear o escribir el código…"
              autocomplete="off"
              spellcheck="false"
              enterkeyhint="done"
              @keydown.enter.prevent="agregarPorLector"
            />
            <p class="ev-mini">
              <ScanBarcode :size="14" stroke-width="2" class="ev-mini-ico" aria-hidden="true" />
              El lector suele enviar <kbd>Enter</kbd> al finalizar el código.
            </p>
          </div>

          <div v-show="modoProducto === 'NOMBRE'" class="ev-panel-prod ev-panel-prod--nombre">
            <label class="ev-etq" for="inp-nombre-prod">Buscar artículo</label>
            <div class="ev-nom-busq">
              <Search class="ev-nom-svg" :size="20" stroke-width="2" aria-hidden="true" />
              <input
                id="inp-nombre-prod"
                ref="refInputNombre"
                v-model="busquedaNombre"
                type="search"
                class="ev-inp ev-inp--grow ev-inp--nom ev-inp--fac"
                placeholder="Nombre, marca…"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <p v-if="!busquedaNombre.trim()" class="ev-nom-ayuda">
              Escribí para buscar; tocá una fila y luego <strong>Agregar</strong>.
            </p>

            <ul
              v-else-if="resultadosProducto.length"
              class="ev-nom-lista"
              role="listbox"
              aria-label="Resultados de búsqueda"
            >
              <li v-for="p in resultadosProducto" :key="p.id">
                <button
                  type="button"
                  class="ev-nom-fila"
                  :class="{ 'ev-nom-fila--sel': productoSeleccionadoId === p.id }"
                  role="option"
                  :aria-selected="productoSeleccionadoId === p.id"
                  @click="seleccionarProductoNombre(p)"
                >
                  <span class="ev-nom-fila-txt">
                    <span class="ev-nom-nom">{{ p.nombre }}</span>
                    <span v-if="p.codigoBarras" class="ev-nom-cod">{{ p.codigoBarras }}</span>
                  </span>
                  <span class="ev-nom-pre">{{ formatoPeso.format(p.precioVenta) }}</span>
                </button>
              </li>
            </ul>

            <p v-else class="ev-nom-sin-res">Sin coincidencias.</p>

            <button
              type="button"
              class="ev-btn-agregar ev-btn-agregar--ancho"
              :disabled="!productoSeleccionadoId"
              @click="agregarProductoNombreSeleccionado"
            >
              Agregar
            </button>
          </div>

          <div class="ev-lineas-env">
            <table class="ev-fac-items">
              <thead>
                <tr>
                  <th scope="col" class="ev-fac-items-desc">Descripción</th>
                  <th scope="col" class="ev-fac-items-cant">Cant.</th>
                  <th scope="col" class="ev-fac-items-pu">P. unit.</th>
                  <th scope="col" class="ev-fac-items-sub">Importe</th>
                  <th class="ev-fac-items-acc" aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                <tr v-if="lineas.length === 0">
                  <td colspan="5" class="ev-fac-items-vacio">
                    Sin líneas. Ingresá artículos con el lector o por nombre.
                  </td>
                </tr>
                <tr v-for="l in lineas" :key="l.productoId" class="ev-fac-item-row">
                  <td class="ev-fac-items-desc">
                    <span class="ev-fac-it-nom">{{ l.nombre }}</span>
                  </td>
                  <td class="ev-fac-items-cant">
                    <span class="ev-linea-cant ev-linea-cant--fac">
                      <button type="button" class="ev-pm" @click="cambiarCantidad(l.productoId, -1)">
                        <Minus :size="16" stroke-width="2" aria-hidden="true" />
                      </button>
                      <span class="ev-fac-it-q">{{ l.cantidad }}</span>
                      <button type="button" class="ev-pm" @click="cambiarCantidad(l.productoId, 1)">
                        <Plus :size="16" stroke-width="2" aria-hidden="true" />
                      </button>
                    </span>
                  </td>
                  <td class="ev-fac-items-pu ev-fac-num">{{ formatoPeso.format(l.precioUnitario) }}</td>
                  <td class="ev-fac-items-sub ev-fac-num">{{ formatoPeso.format(subtotalLinea(l)) }}</td>
                  <td class="ev-fac-items-acc">
                    <button
                      type="button"
                      class="ev-linea-x"
                      :aria-label="`Quitar ${l.nombre}`"
                      @click="quitarLinea(l.productoId)"
                    >
                      <Trash2 :size="16" stroke-width="2" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              v-if="lineas.length"
              type="button"
              class="ev-quitar-todo"
              @click="vaciarLineas"
            >
              Vaciar detalle
            </button>
          </div>

          <div class="ev-fac-subt" aria-live="polite">
            <span class="ev-fac-subt-lbl">Total</span>
            <span class="ev-fac-subt-val">{{ formatoPeso.format(totalTicket) }}</span>
          </div>

          <div class="ev-fac-obs">
            <label class="ev-fac-obs-eti" for="obs">Observaciones</label>
            <textarea
              id="obs"
              v-model="observaciones"
              class="ev-ta ev-ta--fac ev-ta--obs"
              rows="2"
              maxlength="500"
              placeholder="Opcional…"
            />
          </div>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.ev {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 42rem;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.ev--en-modal {
  flex: 1;
  min-height: 0;
  max-width: none;
  height: 100%;
  margin: 0;
  padding: 0.5rem 0.65rem 0.5rem;
  overflow: hidden;
  gap: 0.35rem;
}

/* Una sola superficie: el marco es la caja del modal; acá no repetimos tarjeta */
.ev--en-modal .ev-flujo {
  gap: 0;
}

.ev--en-modal .ev-fact {
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  max-width: none;
  width: 100%;
  margin: 0;
}

.ev--en-modal .ev-cab--nueva {
  margin-top: -0.5rem;
  margin-right: -0.65rem;
  margin-left: -0.65rem;
  margin-bottom: 0;
  padding-left: max(0.65rem, env(safe-area-inset-left, 0px));
  padding-right: max(0.65rem, env(safe-area-inset-right, 0px));
  border: none;
  border-bottom: 1px solid var(--ev-line);
  border-radius: 0;
  box-shadow: none;
  background: rgba(0, 0, 0, 0.12);
}

.ev--en-modal .ev-fact-enc {
  border-radius: 0;
}

.ev-pro {
  --ev-r-xl: 12px;
  --ev-r: 10px;
  --ev-line: rgba(42, 58, 84, 0.75);
  --ev-sh-panel: var(--sombra-suave);
  letter-spacing: -0.01em;
}

.ev-cab {
  margin: 0 0 0.5rem;
}

.ev--en-modal .ev-cab {
  margin-bottom: 0;
}

.ev-cab--nueva {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.5rem 0.65rem;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.15rem;
  border-radius: var(--ev-r-xl);
  border: 1px solid var(--ev-line);
  background: var(--color-fondo-cabecera);
  box-shadow: var(--ev-sh-panel);
}

.ev-cab-fill {
  flex: 1;
  min-width: 0;
}

.ev-volver {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--ev-r);
  background: rgba(124, 140, 240, 0.06);
  padding: 0.4rem 0.55rem;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.ev-volver:hover {
  color: var(--color-acento-hover);
  border-color: rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.1);
}

.ev-toast {
  padding: 0.65rem 1rem;
  border-radius: var(--ev-r);
  font-size: 0.84rem;
  font-weight: 500;
  background: rgba(124, 140, 240, 0.1);
  border: 1px solid var(--color-acento-borde);
  color: var(--color-texto-suave);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.ev-toast-enter-active,
.ev-toast-leave-active {
  transition: opacity 0.18s ease;
}
.ev-toast-enter-from,
.ev-toast-leave-to {
  opacity: 0;
}

.ev-flujo {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 0;
  overflow: hidden;
}

.ev-fact {
  display: flex;
  flex: 1;
  flex-direction: column;
  max-width: 52rem;
  min-height: 0;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--ev-line);
  border-radius: 2px;
  background: var(--color-fondo-cabecera);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 12px 40px rgba(0, 0, 0, 0.35);
}

.ev-fact-enc {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem 0.9rem;
  border-bottom: 3px double var(--color-borde);
  background: var(--color-fondo-elevado);
}

.ev-fact-enc-izq {
  min-width: min(100%, 18rem);
}

.ev-fact-tipo {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--color-texto-apagado);
}

.ev-fact-titulo {
  margin: 0.25rem 0 0;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.ev-fact-ley {
  margin: 0.45rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
}

.ev-fact-enc-der {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.ev-fac-pago-hint {
  margin: 0;
  max-width: none;
  font-size: 0.72rem;
  line-height: 1.4;
  font-style: italic;
  text-align: left;
  color: var(--color-texto-apagado);
}

.ev-fac-bloq--pago .ev-fac-pago-hint {
  margin-top: 0.45rem;
}

.ev-fact-punto {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--ev-line);
  border-radius: var(--ev-r);
  background: var(--color-fondo-cabecera);
}

.ev-fact-punto-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ev-fact-punto-val {
  font-size: 0.82rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-texto-suave);
}

.ev-fac-bloq {
  padding: 0.65rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--ev-line);
}

.ev-fac-bloq--stretch {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ev-fac-bloq--pago {
  flex-shrink: 0;
}

.ev-fac-pago-fila {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  max-width: 26rem;
}

.ev-fac-pago-select {
  width: 100%;
  min-height: 2.45rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.ev-fac-bloq-tit {
  margin: 0 0 0.65rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--ev-line);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

/* Campos receptor (búsqueda + select) */
.ev-fac-cli {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ev-fac-cli-tools {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem 0.85rem;
}

@media (min-width: 520px) {
  .ev-fac-cli-tools {
    grid-template-columns: 1fr 1fr;
    align-items: end;
  }
}

.ev-fac-cli-fld {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.ev-fac-cli-eti {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ev-fac-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.ev-fac-grid th[scope='row'] {
  width: 6.75rem;
  padding: 0.5rem 0.75rem 0.5rem 0;
  vertical-align: top;
  text-align: left;
  font-weight: 600;
  color: var(--color-texto-suave);
  border-bottom: 1px solid var(--ev-line);
}

.ev-fac-grid td {
  padding: 0.5rem 0;
  vertical-align: middle;
  border-bottom: 1px solid var(--ev-line);
}

.ev-fac-grid tr:last-child th,
.ev-fac-grid tr:last-child td {
  border-bottom: none;
}

.ev-fac-muted {
  color: var(--color-texto-apagado);
  font-style: italic;
}

.ev-inp--fac {
  margin: 0;
}

.ev-fac-agre {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  margin-bottom: 0.65rem;
}

.ev-fac-agre-lbl {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-texto-suave);
}

.ev-fac-agre .ev-modo-seg {
  max-width: none;
  flex: 1 1 16rem;
}

.ev-lineas-env {
  flex: 1 1 auto;
  min-height: 6rem;
  margin-top: 0.35rem;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--ev-line);
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
}

.ev-fac-items {
  width: 100%;
  min-width: 36rem;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.ev-fac-items thead th {
  padding: 0.45rem 0.5rem;
  text-align: left;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
  border-bottom: 2px solid var(--color-borde);
  background: rgba(124, 140, 240, 0.08);
}

.ev-fac-items .ev-fac-num {
  font-weight: 600;
}

.ev-fac-items-desc {
  min-width: 12rem;
}

.ev-fac-items-cant {
  width: 8rem;
  text-align: center;
}

.ev-fac-items-pu {
  width: 6.5rem;
  text-align: right;
}

.ev-fac-items-sub {
  width: 7rem;
  text-align: right;
}

.ev-fac-items-acc {
  width: 2.5rem;
}

.ev-fac-items-vacio {
  text-align: center;
  padding: 1.5rem 1rem !important;
  font-style: italic;
  color: var(--color-texto-apagado);
}

.ev-fac-it-nom {
  font-weight: 600;
  line-height: 1.35;
}

.ev-linea-cant--fac {
  justify-content: center;
}

.ev-fac-it-q {
  display: inline-block;
  min-width: 1.35rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.ev-fac-subt {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  justify-content: flex-end;
  gap: 1.25rem;
  margin-top: 0;
  padding: 0.6rem 1rem;
  border-top: 2px solid var(--color-borde);
  background: rgba(124, 140, 240, 0.08);
}

.ev-fac-obs {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0 1.25rem 0.65rem;
}

.ev-fac-obs-eti {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ev-ta--obs {
  margin: 0;
  min-height: 2.4rem;
  max-height: 4.5rem;
  padding: 0.45rem 0.55rem;
  font-size: 0.82rem;
  resize: vertical;
}

.ev-fac-subt-lbl {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}

.ev-fac-subt-val {
  font-size: 1.45rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.ev-ta--fac {
  margin: 0;
  min-height: 3rem;
}

.ev-modo-seg {
  display: flex;
  width: 100%;
  max-width: 22rem;
  padding: 3px;
  border-radius: 12px;
  border: 1px solid var(--ev-line);
  background: var(--color-fondo-cabecera);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
  gap: 3px;
}

.ev-modo-seg-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.45rem;
  padding: 0.45rem 0.65rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--color-texto-apagado);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.ev-modo-seg-btn:hover {
  color: var(--color-texto-suave);
  background: rgba(124, 140, 240, 0.06);
}

.ev-modo-seg-btn--on {
  color: var(--color-texto);
  background: linear-gradient(180deg, rgba(124, 140, 240, 0.2), rgba(124, 140, 240, 0.08));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.ev-modo-ico {
  flex-shrink: 0;
  opacity: 0.95;
}

.ev-panel-prod {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem 0.95rem;
  border-radius: var(--ev-r-xl);
  border: 1px solid var(--ev-line);
  background: var(--color-fondo-cabecera);
}

.ev-inp--lector {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  font-size: 1rem;
}

.ev-panel-prod--nombre {
  gap: 0.55rem;
}

.ev-nom-busq {
  position: relative;
  display: flex;
  align-items: center;
}

.ev-nom-svg {
  position: absolute;
  left: 0.75rem;
  color: var(--color-texto-apagado);
  pointer-events: none;
}

.ev-inp--nom {
  padding-left: 2.5rem;
}

.ev-nom-ayuda,
.ev-nom-sin-res {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-texto-apagado);
}

.ev-nom-lista {
  list-style: none;
  margin: 0;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: min(12rem, 32dvh);
  overflow-y: auto;
  border-radius: var(--ev-r);
  border: 1px solid var(--ev-line);
  background: rgba(7, 11, 20, 0.4);
  scroll-behavior: smooth;
  scrollbar-width: thin;
}

.ev-nom-lista::-webkit-scrollbar {
  width: 6px;
}

.ev-nom-lista::-webkit-scrollbar-thumb {
  background: var(--color-borde);
  border-radius: 4px;
}

.ev-nom-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  font-size: 0.87rem;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.ev-nom-fila:hover {
  background: rgba(124, 140, 240, 0.08);
}

.ev-nom-fila--sel {
  border-color: var(--color-acento);
  background: var(--color-acento-suave);
}

.ev-nom-fila-txt {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ev-nom-nom {
  font-weight: 600;
  line-height: 1.25;
}

.ev-nom-cod {
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
  font-variant-numeric: tabular-nums;
}

.ev-nom-pre {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.ev-btn-otra {
  padding: 0.45rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: var(--ev-r);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  color: var(--color-texto-suave);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.ev-btn-otra:hover {
  border-color: rgba(124, 140, 240, 0.45);
  color: var(--color-texto);
  background: rgba(124, 140, 240, 0.08);
}

.ev-btn-agregar--ancho {
  width: 100%;
  margin-top: 0.25rem;
}

.ev-etq {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--color-texto-suave);
}

.ev-inp {
  width: 100%;
  padding: 0.55rem 0.7rem;
  min-height: 2.5rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--ev-r);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.ev-inp:hover {
  border-color: rgba(124, 140, 240, 0.28);
}

.ev-inp:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.22),
    0 0 0 2px rgba(124, 140, 240, 0.25);
}

.ev-sel {
  cursor: pointer;
  margin-bottom: 0;
}

.ev-inp--grow {
  flex: 1;
  min-width: 0;
}

.ev-btn-agregar {
  padding: 0.62rem 1.1rem;
  font-weight: 700;
  font-size: 0.88rem;
  letter-spacing: 0.02em;
  border: none;
  border-radius: var(--ev-r);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento-intenso));
  color: var(--color-texto-sobre-acento);
  cursor: pointer;
  align-self: stretch;
  box-shadow: 0 2px 8px rgba(91, 110, 230, 0.35);
}

.ev-btn-agregar:hover:not(:disabled) {
  filter: brightness(1.06);
}

.ev-btn-agregar:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ev-mini {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--color-texto-apagado);
  line-height: 1.45;
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
}

.ev-mini-ico {
  flex-shrink: 0;
  margin-top: 0.15rem;
  opacity: 0.85;
}

.ev-mini kbd {
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--color-borde);
  font-size: 0.7rem;
  font-family: inherit;
  background: var(--color-fondo-elevado);
}

.ev-linea-cant {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.ev-pm {
  width: 1.85rem;
  height: 1.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: transparent;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.ev-pm:hover {
  background: rgba(124, 140, 240, 0.12);
  color: var(--color-texto);
}

.ev-linea-sub {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 5rem;
}

.ev-linea-x {
  width: 1.85rem;
  height: 1.85rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-texto-apagado);
  cursor: pointer;
  justify-self: end;
}

.ev-linea-x:hover {
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.1);
}

.ev-quitar-todo {
  margin: 0.35rem 0.6rem 0.5rem;
  padding: 0.25rem 0;
  border: none;
  background: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  text-decoration: underline;
  cursor: pointer;
  justify-self: start;
}

.ev-quitar-todo:hover {
  color: var(--color-peligro);
}

.ev-ta {
  width: 100%;
  margin-bottom: 0.85rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--ev-r);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.88rem;
  resize: vertical;
  min-height: 2.85rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ev-ta:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(124, 140, 240, 0.22);
}

.ev-btn-confirmar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  border-radius: var(--ev-r);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--color-texto-sobre-acento);
  background: var(--color-acento);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(91, 110, 230, 0.35);
  transition:
    background 0.15s ease,
    filter 0.15s ease;
}

.ev-btn-confirmar:hover:not(:disabled) {
  background: var(--color-acento-hover);
}

.ev-btn-confirmar:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  box-shadow: none;
}

.ev-btn-confirmar--cab {
  width: auto;
  flex-shrink: 0;
  padding: 0.5rem 0.8rem;
  font-size: 0.84rem;
  white-space: nowrap;
}
</style>
