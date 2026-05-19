<script setup lang="ts">
import {
  ClipboardList,
  Info,
  PackagePlus,
  RefreshCw,
  Warehouse,
} from 'lucide-vue-next';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { usuarioPuedeAjustarStock } from '../../modulos/inventario/permisosInventario';
import { useCatalogoStore } from '../../stores/catalogo';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';
import { useSesionStore } from '../../stores/sesion';
import { useStockStore } from '../../stores/stock';
import type { Producto } from '../../tipos/catalogo';

const UMBRAL_BAJO = 12;

const catalogoStore = useCatalogoStore();
const stockStore = useStockStore();
const sesionStore = useSesionStore();
const gestionUsuariosStore = useGestionUsuariosStore();
const { productos, categorias } = storeToRefs(catalogoStore);

const puedeGestionar = computed(() => {
  const usuarioSesion = sesionStore.usuario;
  if (!usuarioSesion) return false;
  const filaGestion = gestionUsuariosStore.obtenerPorId(usuarioSesion.id);
  if (filaGestion?.habilitado) {
    return filaGestion.permisos.puedeAjustarStock;
  }
  return usuarioPuedeAjustarStock(usuarioSesion.rol ?? undefined);
});
const busqueda = ref('');
const categoriaSeleccionada = ref<string>('');
const soloStockCritico = ref(false);
const soloStockBajo = ref(false);

const refModalConteo = useTemplateRef('refModalConteo');
const refModalEntrada = useTemplateRef('refModalEntrada');

const productoConteoSeleccionado = ref<Producto | null>(null);
const cantidadContadaTexto = ref('');
const observacionConteoTexto = ref('');
const mensajeModalConteo = ref('');

const productoEntradaSeleccionado = ref<Producto | null>(null);
const unidadesEntradaTexto = ref('');
const observacionEntradaTexto = ref('');
const mensajeModalEntrada = ref('');

const filasFiltradas = computed(() => {
  const textoBusqueda = busqueda.value.trim().toLowerCase();
  const idCategoriaFiltro = categoriaSeleccionada.value.trim();
  return [...productos.value]
    .map((producto): { producto: Producto; existencia: number } => ({
      producto,
      existencia: stockStore.cantidadActual(producto.id),
    }))
    .filter(({ producto }) => !idCategoriaFiltro || producto.categoriaId === idCategoriaFiltro)
    .filter(({ existencia }) => {
      if (soloStockCritico.value) return existencia === 0;
      if (soloStockBajo.value) return existencia > 0 && existencia <= UMBRAL_BAJO;
      return true;
    })
    .filter(({ producto }) => {
      if (!textoBusqueda) return true;
      const agregado =
        `${producto.nombre} ${producto.marca} ${producto.tipoPrenda} ${producto.descripcion} ${producto.codigoBarras}`
          .toLowerCase()
          .trim();
      return agregado.includes(textoBusqueda);
    })
    .sort((a, b) =>
      a.producto.nombre.localeCompare(b.producto.nombre, 'es', { sensitivity: 'base' })
    );
});

function limpiarFiltros(): void {
  busqueda.value = '';
  categoriaSeleccionada.value = '';
  soloStockCritico.value = false;
  soloStockBajo.value = false;
}

watch(soloStockCritico, (marca) => {
  if (marca) soloStockBajo.value = false;
});

watch(soloStockBajo, (marca) => {
  if (marca) soloStockCritico.value = false;
});

const opcionesCategoriaParaFiltro = computed(() =>
  categorias.value.map((c) => ({ etiqueta: c.nombre, valor: c.id }))
);

function claseEstadoCantidad(unidades: number): string {
  if (unidades === 0) return 'stk-chip stk-chip--agotado';
  if (unidades <= UMBRAL_BAJO) return 'stk-chip stk-chip--bajo';
  return 'stk-chip stk-chip--normal';
}

function textoEstadoCantidad(unidades: number): string {
  if (unidades === 0) return 'Sin stock';
  if (unidades <= UMBRAL_BAJO) return 'Stock bajo';
  return 'En rango normal';
}

function abrirModalConteo(producto: Producto): void {
  mensajeModalConteo.value = '';
  productoConteoSeleccionado.value = producto;
  cantidadContadaTexto.value = String(stockStore.cantidadActual(producto.id));
  observacionConteoTexto.value = '';
  nextTick(() => refModalConteo.value?.showModal());
}

function cerrarModalConteo(): void {
  refModalConteo.value?.close();
}

function alCerrarModalConteo(): void {
  productoConteoSeleccionado.value = null;
  mensajeModalConteo.value = '';
}

function guardarModalConteo(): void {
  const producto = productoConteoSeleccionado.value;
  if (!producto || !sesionStore.usuario) return;

  let cantidadFisica = Math.floor(Number(String(cantidadContadaTexto.value).trim()));
  if (!Number.isFinite(cantidadFisica) || cantidadFisica < 0) {
    mensajeModalConteo.value = 'La cantidad contada debe ser un número mayor o igual a 0.';
    return;
  }

  stockStore.aplicarAjustePorConteo(
    producto.id,
    producto.nombre,
    cantidadFisica,
    sesionStore.usuario.nombreUsuario,
    observacionConteoTexto.value.trim() || undefined
  );
  cerrarModalConteo();
}

function abrirModalEntrada(producto: Producto): void {
  mensajeModalEntrada.value = '';
  productoEntradaSeleccionado.value = producto;
  unidadesEntradaTexto.value = '';
  observacionEntradaTexto.value = '';
  nextTick(() => refModalEntrada.value?.showModal());
}

function cerrarModalEntrada(): void {
  refModalEntrada.value?.close();
}

function alCerrarModalEntrada(): void {
  productoEntradaSeleccionado.value = null;
}

function guardarModalEntrada(): void {
  const producto = productoEntradaSeleccionado.value;
  if (!producto || !sesionStore.usuario) return;

  const unidadesRaw = Number(String(unidadesEntradaTexto.value).replace(',', '.'));
  const unidades = Math.floor(Math.abs(unidadesRaw));
  if (!Number.isFinite(unidadesRaw) || unidades <= 0) {
    mensajeModalEntrada.value =
      'Ingresá un número entero positivo (cantidad que ingresa al inventario físico).';
    return;
  }

  stockStore.aplicarEntradaPorCompra(
    producto.id,
    producto.nombre,
    unidades,
    observacionEntradaTexto.value.trim() || undefined,
    sesionStore.usuario.nombreUsuario
  );
  cerrarModalEntrada();
}
</script>

<template>
  <section class="stk" aria-labelledby="tit-stock-actual">
    <header class="stk-cab">
      <div class="stk-cab-izq">
        <Warehouse :size="22" aria-hidden="true" class="stk-icono" stroke-width="1.85" />
        <div class="stk-cab-textos">
          <h1 id="tit-stock-actual" class="stk-tit">Stock actual</h1>
          <p class="stk-sub">
            Existencias disponibles para vender hoy. El detalle de cada movimiento y variación queda en
            <RouterLink class="stk-enlace-interno" :to="{ name: 'stock-auditorias' }">
              Auditorías de stock
            </RouterLink>
            . Las ventas del POS descuentan stock en tiempo casi inmediato. La
            <strong class="stk-sub-r">entrada por compra</strong> y el
            <strong class="stk-sub-r">conteo físico</strong> requieren permisos de gestión.
          </p>
        </div>
      </div>
      <p v-if="!puedeGestionar" class="stk-banner-lectura">
        <Info class="stk-banner-ico" :size="16" aria-hidden="true" />
        Como empleado podés revisar filtros y existencias. El ajuste por conteo o la entrada
        manual están reservadas al dueño de la tienda o al usuario administrativo.
      </p>
    </header>

    <div class="stk-barra">
      <div class="stk-barra-col stk-barra-col--busq">
        <label class="stk-etq-bl" for="stk-filtro-busq">
          <span class="stk-etiqueta-bl">Buscar</span>
          <input
            id="stk-filtro-busq"
            v-model="busqueda"
            type="search"
            class="stk-inp"
            placeholder="Nombre, marca o código…"
            autocomplete="off"
          />
        </label>
      </div>

      <div class="stk-barra-col stk-barra-col--cat">
        <label class="stk-etq-bl" for="stk-filtro-cat">
          <span class="stk-etiqueta-bl">Categoría</span>
          <select id="stk-filtro-cat" v-model="categoriaSeleccionada" class="stk-inp">
            <option value="">Todas</option>
            <option v-for="c in opcionesCategoriaParaFiltro" :key="c.valor" :value="c.valor">
              {{ c.etiqueta }}
            </option>
          </select>
        </label>
      </div>

      <div class="stk-barra-col stk-barra-col--atajos">
        <div class="stk-etq-bl">
          <span id="stk-leyenda-atajos" class="stk-etiqueta-bl">Filtros rápidos</span>
          <div class="stk-filtros-cheq" role="group" aria-labelledby="stk-leyenda-atajos">
            <label class="stk-cheq-wrap">
              <input v-model="soloStockCritico" type="checkbox" class="stk-cheq" />
              Solo agotados
            </label>
            <label class="stk-cheq-wrap">
              <input v-model="soloStockBajo" type="checkbox" class="stk-cheq" />
              Solo {{ UMBRAL_BAJO }} o menos unidades
            </label>
          </div>
        </div>
      </div>

      <div class="stk-barra-col stk-barra-col--reinicio">
        <div class="stk-etq-bl">
          <span class="stk-etiqueta-bl">Reinicio</span>
          <button type="button" class="stk-btn-sec stk-btn-reset" @click="limpiarFiltros">
            <RefreshCw :size="16" aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <div class="stk-tab-wrap" role="region" aria-label="Existencias por producto">
      <table class="stk-tabla">
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Marca / tipo</th>
            <th scope="col" class="stk-col-corta">Categoría</th>
            <th scope="col" class="stk-col-corta">Código</th>
            <th scope="col" class="stk-der stk-col-stock">Cantidad</th>
            <th scope="col">Estado</th>
            <th v-if="puedeGestionar" scope="col" class="stk-col-acc stk-acc-h stk-der">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="{ producto: p, existencia } in filasFiltradas" :key="p.id">
            <td class="stk-nombre">{{ p.nombre }}</td>
            <td>
              {{ p.marca }}
              <span class="stk-mute stk-mono-mini"> · {{ p.tipoPrenda }}</span>
            </td>
            <td class="stk-mute stk-col-corta">{{ catalogoStore.nombreCategoria(p.categoriaId) }}</td>
            <td class="stk-mono stk-col-corta">{{ p.codigoBarras?.trim() || '—' }}</td>
            <td class="stk-der stk-mono stk-cant">{{ existencia }}</td>
            <td>
              <span :class="claseEstadoCantidad(existencia)">{{ textoEstadoCantidad(existencia) }}</span>
            </td>
            <td v-if="puedeGestionar" class="stk-acc-cel stk-der stk-acc-h">
              <button type="button" class="stk-ac-mini" title="Registrar conteo físico" @click="abrirModalConteo(p)">
                <ClipboardList class="stk-ac-mini-ico" :size="17" aria-hidden="true" />
                Conteo
              </button>
              <button type="button" class="stk-ac-mini stk-ac-mini--entr" title="Entrada tipo compra manual" @click="abrirModalEntrada(p)">
                <PackagePlus class="stk-ac-mini-ico" :size="17" aria-hidden="true" />
                Entrada
              </button>
            </td>
          </tr>
          <tr v-if="filasFiltradas.length === 0">
            <td :colspan="puedeGestionar ? 7 : 6" class="stk-vacio">
              No encontramos líneas para las condiciones marcadas en los filtros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <dialog
        ref="refModalConteo"
        class="stk-dlg-conte"
        aria-labelledby="stk-dlg-conte-h"
        @close="alCerrarModalConteo"
      >
        <div v-if="productoConteoSeleccionado" class="stk-dlg-pane" @click.stop>
          <header class="stk-dlg-cap">
            <h2 id="stk-dlg-conte-h">Conteo físico · {{ productoConteoSeleccionado.nombre }}</h2>
            <button type="button" class="stk-dlg-x" aria-label="Cerrar" @click="cerrarModalConteo">
              ×
            </button>
          </header>
          <p class="stk-dlg-ley">
            Indicá cuántas unidades contaste en el depósito o en el punto de venta. El sistema toma esa
            cifra como la existencia nueva y registra una variación contra el estado contable anterior.
          </p>
          <p class="stk-dlg-mini">
            <span class="stk-mono-mini">Cantidad antes (contable)</span>:
            {{
              stockStore.cantidadActual(productoConteoSeleccionado.id)
            }}
            unidades
          </p>
          <label class="stk-dlg-lab stk-etq-bl">
            <span class="stk-etiqueta-bl">Unidades físicas contadas</span>
            <input
              v-model="cantidadContadaTexto"
              type="text"
              inputmode="numeric"
              class="stk-inp"
              autocomplete="off"
            />
          </label>
          <label class="stk-dlg-lab stk-etq-bl">
            <span class="stk-etiqueta-bl">Observaciones opcionales</span>
            <textarea
              v-model="observacionConteoTexto"
              class="stk-txt"
              rows="3"
              maxlength="240"
              placeholder="Ej. Conteo rutinario, corrección después de pérdidas…"
              autocomplete="off"
            ></textarea>
          </label>
          <p v-if="mensajeModalConteo" class="stk-dlg-msg" role="alert">{{ mensajeModalConteo }}</p>
          <footer class="stk-dlg-acc">
            <button type="button" class="stk-btn-sec" @click="cerrarModalConteo">Cancelar</button>
            <button type="button" class="stk-btn-pri" @click="guardarModalConteo">
              Registrar conteo físico
            </button>
          </footer>
        </div>
      </dialog>

      <dialog
        ref="refModalEntrada"
        class="stk-dlg-conte"
        aria-labelledby="stk-dlg-entr-h"
        @close="alCerrarModalEntrada"
      >
        <div v-if="productoEntradaSeleccionado" class="stk-dlg-pane" @click.stop>
          <header class="stk-dlg-cap">
            <h2 id="stk-dlg-entr-h">Entrada mercadería · {{ productoEntradaSeleccionado.nombre }}</h2>
            <button type="button" class="stk-dlg-x" aria-label="Cerrar" @click="cerrarModalEntrada">
              ×
            </button>
          </header>
          <p class="stk-dlg-ley">
            Sumá aquí mercadería que ingresó al inventario físico antes de tener el circuito formal de
            compras cargado contra proveedores. Las unidades aumentan disponibles sin descontar efectivo ni
            IVA hasta que existan remitos electrónicos reales enlazados.
          </p>
          <label class="stk-dlg-lab stk-etq-bl">
            <span class="stk-etiqueta-bl">Unidades nuevas disponibles para ventas</span>
            <input
              v-model="unidadesEntradaTexto"
              type="text"
              inputmode="decimal"
              class="stk-inp"
              autocomplete="off"
              placeholder="Ej. 120"
            />
          </label>
          <label class="stk-dlg-lab stk-etq-bl">
            <span class="stk-etiqueta-bl">Referencias (opcional)</span>
            <textarea
              v-model="observacionEntradaTexto"
              class="stk-txt"
              rows="2"
              maxlength="200"
              placeholder="Ej. Factura FAC-B 00432, orden proveedor norte…"
              autocomplete="off"
            ></textarea>
          </label>
          <p v-if="mensajeModalEntrada" class="stk-dlg-msg" role="alert">{{ mensajeModalEntrada }}</p>
          <footer class="stk-dlg-acc">
            <button type="button" class="stk-btn-sec" @click="cerrarModalEntrada">Cancelar</button>
            <button type="button" class="stk-btn-pri" @click="guardarModalEntrada">
              Registrar entrada
            </button>
          </footer>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.stk {
  width: 100%;
  max-width: 1120px;
  margin-inline: auto;
}

.stk-cab {
  margin-bottom: 1.15rem;
}

.stk-cab-izq {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.stk-icono {
  flex-shrink: 0;
  color: var(--color-acento);
  opacity: 0.95;
  margin-top: 0.1rem;
}

.stk-tit {
  margin: 0;
  font-size: clamp(1.18rem, 2.8vw, 1.52rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stk-sub {
  margin: 0.35rem 0 0;
  font-size: 0.865rem;
  line-height: 1.52;
  color: var(--color-texto-apagado);
  max-width: 58rem;
}

.stk-sub-r {
  color: var(--color-texto-suave);
  font-weight: 600;
}

.stk-enlace-interno {
  color: var(--color-acento-hover);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(124, 140, 240, 0.45);
}

.stk-enlace-interno:hover {
  filter: brightness(1.08);
}

.stk-banner-lectura {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin: 1rem 0 0;
  padding: 0.65rem 0.82rem;
  border-radius: 10px;
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.06);
  color: var(--color-texto-suave);
  font-size: 0.81rem;
  line-height: 1.45;
}

.stk-banner-ico {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--color-acento);
}

.stk-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.75rem 1.15rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.stk-barra-col {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.stk-barra-col--busq {
  flex: 1 1 12rem;
  min-width: min(100%, 11.5rem);
}

.stk-barra-col--cat {
  flex: 0 1 10.75rem;
  min-width: min(100%, 9.5rem);
}

.stk-barra-col--atajos {
  flex: 1 1 15rem;
  min-width: min(100%, 14rem);
}

.stk-barra-col--reinicio {
  flex: 0 0 auto;
  margin-left: auto;
}

.stk-barra-col--reinicio .stk-btn-reset {
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .stk-barra-col--reinicio .stk-btn-reset {
    width: auto;
    min-width: 10.5rem;
  }
}

@media (max-width: 719px) {
  .stk-barra-col--reinicio {
    margin-left: 0;
    flex: 1 1 100%;
  }
}

.stk-etq-bl {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.stk-etiqueta-bl {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.stk-inp {
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

.stk-btn-sec,
.stk-btn-pri {
  cursor: pointer;
  border-radius: 10px;
  font-weight: 600;
  padding: 0.45rem 0.92rem;
  font-size: 0.85rem;
}

.stk-btn-sec {
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto);
}

.stk-btn-pri {
  border: none;
  background: linear-gradient(158deg, var(--color-acento-intenso), var(--color-acento));
  color: var(--color-texto-sobre-acento);
}

.stk-btn-reset {
  white-space: nowrap;
  gap: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.38rem;
  box-sizing: border-box;
  padding-inline: 0.85rem;
}

.stk-cheq-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.805rem;
  color: var(--color-texto-suave);
  line-height: 1.25;
}

.stk-cheq {
  accent-color: var(--color-acento);
  width: 1.02rem;
  height: 1.02rem;
  flex-shrink: 0;
}

.stk-filtros-cheq {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: 0.45rem 1.15rem;
  min-height: 2.38rem;
  box-sizing: border-box;
  padding: 0.15rem 0;
}

.stk-tab-wrap {
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  overflow-x: auto;
  background: var(--color-fondo-elevado);
}

.stk-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.878rem;
  min-width: 720px;
}

.stk-tabla th,
.stk-tabla td {
  padding: 0.58rem 0.82rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
  text-align: left;
}

.stk-tabla th {
  font-size: 0.715rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  white-space: nowrap;
}

.stk-der {
  text-align: right;
}

.stk-col-corta {
  max-width: 8.75rem;
  white-space: nowrap;
}

.stk-col-stock {
  white-space: nowrap;
}

.stk-acc-h {
  min-width: 11.5rem;
}

.stk-nombre {
  font-weight: 600;
}

.stk-mute {
  color: var(--color-texto-apagado);
  font-weight: normal;
}

.stk-inline {
  display: inline;
}

.stk-mono {
  font-variant-numeric: tabular-nums;
}

.stk-mono-mini {
  font-variant-numeric: tabular-nums;
  font-size: 0.785rem;
}

.stk-chip {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.695rem;
  font-weight: 600;
}

.stk-chip--agotado {
  background: rgba(251, 113, 133, 0.16);
  color: var(--color-peligro);
  border: 1px solid rgba(251, 113, 133, 0.35);
}

.stk-chip--bajo {
  background: rgba(249, 200, 80, 0.12);
  color: rgb(237, 206, 120);
  border: 1px solid rgba(249, 200, 80, 0.35);
}

.stk-chip--normal {
  border: 1px solid transparent;
  color: var(--color-exito);
}

.stk-cant {
  font-weight: 700;
}

.stk-acc-cel {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.42rem;
}

.stk-ac-mini {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  border-radius: 9px;
  border: 1px solid rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.08);
  color: var(--color-acento-hover);
  padding: 0.3rem 0.62rem;
  font-size: 0.695rem;
  font-weight: 600;
  white-space: nowrap;
}

.stk-ac-mini--entr {
  border-color: rgba(74, 222, 128, 0.35);
  background: rgba(74, 222, 128, 0.1);
  color: var(--color-exito);
}

.stk-ac-mini:hover {
  filter: brightness(1.06);
}

.stk-ac-mini-ico {
  flex-shrink: 0;
}

.stk-vacio {
  padding: 1.95rem !important;
  text-align: center !important;
  color: var(--color-texto-apagado);
  border-bottom: none !important;
}

.stk-vacio-mini {
  padding: 1.15rem !important;
  font-size: 0.86rem !important;
}

.stk-dlg-conte {
  border: none;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(28rem, 100%);
  border-radius: 14px;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(124, 140, 240, 0.12);
  background: transparent;
}

.stk-dlg-conte::backdrop {
  background: rgba(8, 10, 20, 0.72);
  backdrop-filter: blur(3px);
}

.stk-dlg-pane {
  padding: 1.1rem clamp(1rem, 3vw, 1.35rem);
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  border-radius: 14px;
}

.stk-dlg-cap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.75rem;
}

.stk-dlg-cap h2 {
  margin: 0;
  font-size: clamp(1.02rem, 2.8vw, 1.22rem);
  font-weight: 700;
}

.stk-dlg-x {
  border-radius: 8px;
  width: 2.05rem;
  height: 2.05rem;
  cursor: pointer;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-apagado);
  font-size: 1.05rem;
  line-height: 1;
}

.stk-dlg-x:hover {
  color: var(--color-texto);
}

.stk-dlg-ley {
  margin: 0 0 0.82rem;
  font-size: 0.795rem;
  line-height: 1.53;
  color: var(--color-texto-apagado);
}

.stk-dlg-mini {
  margin: -0.2rem 0 0.9rem;
  font-size: 0.782rem;
  color: var(--color-texto-suave);
}

.stk-dlg-lab + .stk-dlg-lab {
  margin-top: 0.85rem;
}

.stk-dlg-acc {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.05rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-borde);
}

.stk-txt {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  padding: 0.55rem 0.72rem;
  resize: vertical;
  min-height: 3rem;
}

.stk-dlg-msg {
  margin-top: 0.65rem;
  font-size: 0.8rem;
  color: var(--color-peligro);
}

@media (max-width: 640px) {
  .stk-acc-cel {
    justify-content: flex-start;
    flex-direction: column;
    align-items: stretch;
  }

  .stk-ac-mini {
    justify-content: center;
  }
}
</style>
