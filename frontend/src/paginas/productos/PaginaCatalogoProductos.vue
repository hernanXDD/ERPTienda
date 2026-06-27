<script setup lang="ts">
import { Layers, Package, Plus, RefreshCw } from 'lucide-vue-next';
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import ModalFormularioProducto from '../../componentes/catalogo/ModalFormularioProducto.vue';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useCatalogoStore } from '../../stores/catalogo';
import { useStockStore } from '../../stores/stock';
import type { Producto } from '../../tipos/catalogo';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import { formatearMoneda } from '../../utilidades/formatoMoneda';

const descripcionPagina = obtenerDescripcionPagina('productos-catalogo');

const catalogo = useCatalogoStore();
const stockStore = useStockStore();
const { tienePermiso } = usePermisosOperador();
const puedeGestionarCatalogo = computed(() => tienePermiso('puedeGestionarCatalogoProductos'));
const { categorias, productos, variantes } = storeToRefs(catalogo);

const refModalProducto = useTemplateRef('refModalProducto');
const busqueda = ref('');
const categoriaFiltro = ref('');
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

const productosOrdenados = computed(() => {
  return [...productos.value].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
  );
});

const totalVariantesActivas = computed(() =>
  variantes.value.filter((v) => v.activa).length,
);

const productosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  const idCat = categoriaFiltro.value.trim();
  return productosOrdenados.value.filter((p) => {
    if (idCat && p.categoriaId !== idCat) return false;
    if (!texto) return true;
    const categoria = catalogo.nombreCategoria(p.categoriaId).toLowerCase();
    const agregado = `${p.nombre} ${p.marca} ${p.descripcion} ${categoria}`.toLowerCase();
    return agregado.includes(texto);
  });
});

const hayFiltrosActivos = computed(
  () => Boolean(busqueda.value.trim() || categoriaFiltro.value.trim()),
);

function limpiarFiltros(): void {
  busqueda.value = '';
  categoriaFiltro.value = '';
}

function resumenDescripcion(texto: string): string {
  const t = texto.trim();
  if (!t) return '—';
  return t.length > 56 ? `${t.slice(0, 53)}…` : t;
}

function mostrarToast(texto: string, tipo: 'error' | 'ok') {
  mensajeToast.value = texto;
  tipoMensajeToast.value = tipo;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, 4000);
}

function abrirNuevo() {
  refModalProducto.value?.abrirNuevo();
}

function abrirModificar(p: Producto) {
  refModalProducto.value?.abrirEdicion(p.id);
}

function alGuardarProducto(payload: { modo: 'crear' | 'editar' }) {
  mostrarToast(
    payload.modo === 'editar'
      ? 'Producto y variantes actualizados.'
      : 'Producto creado con sus variantes.',
    'ok',
  );
}

function cantidadVariantesProducto(productoId: string): number {
  return catalogo.cantidadVariantesActivas(productoId);
}

async function borrar(p: Producto) {
  if (!globalThis.confirm(`¿Borrar el producto «${p.nombre}» y todas sus variantes?`)) return;
  try {
    const idsVariantes = await catalogo.eliminarProducto(p.id);
    stockStore.quitarVariantes(idsVariantes);
    await stockStore.cargar();
    mostrarToast('Producto borrado.', 'ok');
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo borrar el producto.'), 'error');
  }
}

onMounted(() => {
  void catalogo.asegurarCargado();
});
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-prod">
    <div class="pg-marco pg-marco--catalogo pg-marco--tarjetas">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Package :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Productos · Catálogo</p>
              <h1 id="titulo-prod" class="pg-titulo">Catálogo de productos</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
        <div class="pg-kpis" aria-label="Resumen del catálogo">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Productos</span>
            <span class="pg-kpi-valor pg-mono">{{ productos.length }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Variantes activas</span>
            <span class="pg-kpi-valor pg-mono">{{ totalVariantesActivas }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Categorías</span>
            <span class="pg-kpi-valor pg-mono">{{ categorias.length }}</span>
          </div>
        </div>
      </header>

      <p v-if="!puedeGestionarCatalogo" class="cat-prod-banner-lectura" role="status">
        Tenés acceso de lectura al catálogo. Para crear o modificar productos necesitás el permiso
        correspondiente.
      </p>

      <div class="pg-barra">
        <div class="pg-barra-fila">
          <div class="pg-barra-col pg-barra-col--busq">
            <label class="pg-filtro-etiq" for="cat-prod-busq">Buscar</label>
            <input
              id="cat-prod-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Nombre, marca, categoría…"
              autocomplete="off"
            />
          </div>
          <div class="pg-barra-col pg-barra-col--cat">
            <label class="pg-filtro-etiq" for="cat-prod-filtro-cat">Categoría</label>
            <select
              id="cat-prod-filtro-cat"
              v-model="categoriaFiltro"
              class="pg-filtro-inp pg-filtro-sel"
            >
              <option value="">Todas</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="pg-barra-col pg-barra-col--reinicio">
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
          <div class="pg-barra-col pg-barra-col--accion">
            <span class="pg-filtro-etiq pg-sr">Acción</span>
            <button
              v-if="puedeGestionarCatalogo"
              type="button"
              class="pg-btn-primario cat-prod-btn-nuevo"
              @click="abrirNuevo"
            >
              <Plus :size="18" stroke-width="2" aria-hidden="true" />
              Nuevo producto
            </button>
          </div>
        </div>
        <p
          v-if="mensajeToast"
          class="cat-prod-aviso"
          :class="`cat-prod-aviso--${tipoMensajeToast}`"
          role="status"
        >
          {{ mensajeToast }}
        </p>
      </div>

      <p class="pg-resumen pg-resumen--flex" role="status">
        <span>
          Mostrando <strong>{{ productosFiltrados.length }}</strong>
          {{
            productosFiltrados.length === 1 ? 'producto' : 'productos'
          }}
          <template v-if="hayFiltrosActivos"> (filtros activos)</template>
        </span>
        <span v-if="productos.length > 0">
          Total en catálogo: <strong>{{ productos.length }}</strong>
        </span>
      </p>

      <section
        class="cat-prod-movil pg-tabla-cuerpo"
        role="region"
        aria-label="Listado de productos"
      >
        <ul
          v-if="productosFiltrados.length > 0"
          class="cat-prod-lista"
          role="list"
          aria-label="Productos filtrados"
        >
          <li v-for="p in productosFiltrados" :key="p.id" role="listitem">
            <button
              v-if="puedeGestionarCatalogo"
              type="button"
              class="cat-prod-tarjeta"
              @click="abrirModificar(p)"
            >
              <div class="cat-prod-tarjeta-cab">
                <div class="cat-prod-cel-nombre">
                  <span class="cat-prod-nombre">{{ p.nombre }}</span>
                  <span v-if="p.marca.trim()" class="cat-prod-marca">{{ p.marca }}</span>
                </div>
              </div>
              <div class="cat-prod-tarjeta-chips">
                <span class="cat-prod-chip">
                  <Layers :size="12" aria-hidden="true" />
                  {{ catalogo.nombreCategoria(p.categoriaId) }}
                </span>
              </div>
              <p
                v-if="p.descripcion.trim()"
                class="cat-prod-tarjeta-desc"
                :title="p.descripcion.trim()"
              >
                {{ resumenDescripcion(p.descripcion) }}
              </p>
              <div class="cat-prod-tarjeta-total">
                <span class="cat-prod-tarjeta-total-etiq">
                  {{ cantidadVariantesProducto(p.id) }}
                  {{ cantidadVariantesProducto(p.id) === 1 ? 'variante' : 'variantes' }}
                </span>
                <strong class="pg-mono">{{ formatearMoneda(p.precioVenta) }}</strong>
              </div>
            </button>
            <article v-else class="cat-prod-tarjeta cat-prod-tarjeta--lectura">
              <div class="cat-prod-tarjeta-cab">
                <div class="cat-prod-cel-nombre">
                  <span class="cat-prod-nombre">{{ p.nombre }}</span>
                  <span v-if="p.marca.trim()" class="cat-prod-marca">{{ p.marca }}</span>
                </div>
              </div>
              <div class="cat-prod-tarjeta-chips">
                <span class="cat-prod-chip">
                  <Layers :size="12" aria-hidden="true" />
                  {{ catalogo.nombreCategoria(p.categoriaId) }}
                </span>
              </div>
              <p
                v-if="p.descripcion.trim()"
                class="cat-prod-tarjeta-desc"
                :title="p.descripcion.trim()"
              >
                {{ resumenDescripcion(p.descripcion) }}
              </p>
              <div class="cat-prod-tarjeta-total">
                <span class="cat-prod-tarjeta-total-etiq">
                  {{ cantidadVariantesProducto(p.id) }}
                  {{ cantidadVariantesProducto(p.id) === 1 ? 'variante' : 'variantes' }}
                </span>
                <strong class="pg-mono">{{ formatearMoneda(p.precioVenta) }}</strong>
              </div>
            </article>
          </li>
        </ul>
        <p v-else class="cat-prod-vacio" role="status">
          <template v-if="productos.length === 0">
            No hay productos cargados. Usá <strong>Nuevo producto</strong> para agregar el primero.
          </template>
          <template v-else>
            Ningún producto coincide con los filtros.
            <button type="button" class="cat-prod-link-vacio" @click="limpiarFiltros">
              Limpiar filtros
            </button>
          </template>
        </p>
      </section>

      <section
        class="pg-cuerpo pg-cuerpo--grilla cat-prod-escritorio"
        aria-label="Listado de productos"
      >
        <div v-if="productosFiltrados.length > 0" class="pg-grilla-viewport">
          <div class="pg-grilla-wrap">
            <article v-for="p in productosFiltrados" :key="p.id" class="pg-card">
              <div class="pg-card-afilado" aria-hidden="true" />
              <div class="pg-card-cuerpo pg-card-cuerpo--resumida">
                <header class="pg-card-cab">
                  <h2 class="pg-card-nom">{{ p.nombre }}</h2>
                  <span class="pg-card-precio">{{ formatearMoneda(p.precioVenta) }}</span>
                </header>
                <p v-if="p.marca.trim()" class="pg-card-sub">{{ p.marca }}</p>
                <div class="pg-card-estados">
                  <div class="pg-card-fila-estado" :aria-label="`Categoría: ${catalogo.nombreCategoria(p.categoriaId)}`">
                    <span class="pg-card-etiq">Cat.</span>
                    <span class="pg-chip pg-chip--info">
                      <Layers :size="11" aria-hidden="true" />
                      {{ catalogo.nombreCategoria(p.categoriaId) }}
                    </span>
                  </div>
                  <div class="pg-card-fila-estado" :aria-label="`${cantidadVariantesProducto(p.id)} variantes`">
                    <span class="pg-card-etiq">Var.</span>
                    <span class="pg-chip pg-chip--info pg-mono">{{ cantidadVariantesProducto(p.id) }}</span>
                  </div>
                </div>
                <footer v-if="puedeGestionarCatalogo" class="pg-card-pie">
                  <div class="pg-card-acciones">
                    <button type="button" class="pg-btn-card" @click="abrirModificar(p)">
                      Editar
                    </button>
                    <button type="button" class="pg-btn-card pg-btn-card--peligro" @click="borrar(p)">
                      Borrar
                    </button>
                  </div>
                </footer>
              </div>
            </article>
          </div>
        </div>
        <div v-else-if="productos.length === 0" class="pg-vacio--grilla" role="status">
          <span class="pg-vacio--grilla-tit">No hay productos</span>
          <span>Usá <strong>Nuevo producto</strong> para agregar el primero.</span>
        </div>
        <p v-else class="pg-vacio--grilla" role="status">
          Ningún producto coincide con los filtros.
          <button type="button" class="cat-prod-link-vacio" @click="limpiarFiltros">
            Limpiar filtros
          </button>
        </p>
      </section>
    </div>

    <ModalFormularioProducto ref="refModalProducto" @guardado="alGuardarProducto" />
  </section>
</template>

<style scoped>
.cat-prod-banner-lectura,
.cat-gest-banner-lectura {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.85rem;
  padding: 0.72rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--color-texto-suave);
}

.pg-marco--catalogo {
  --pg-reserva-vertical-vista: clamp(14rem, 28dvh, 20rem);
  --pg-grilla-altura-fila: 9.4rem;
}

.cat-prod-movil {
  display: none;
}

.cat-prod-escritorio {
  display: flex;
}

.cat-prod-btn-nuevo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .cat-prod-btn-nuevo {
    width: auto;
  }
}

.cat-prod-aviso {
  flex: 1 1 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.cat-prod-aviso--ok {
  color: var(--color-exito);
  background: var(--color-exito-suave);
  border: 1px solid var(--color-exito-borde);
}

.cat-prod-aviso--error {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
}

.cat-prod-cel-nombre {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 8rem;
}

.cat-prod-nombre {
  font-weight: 600;
  color: var(--color-texto);
  line-height: 1.25;
}

.cat-prod-marca {
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.cat-prod-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-acento-borde);
  white-space: nowrap;
}

.cat-prod-cel-desc {
  color: var(--color-texto-suave);
  font-size: 0.84rem;
}

.cat-prod-link-vacio {
  display: inline;
  margin-left: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-acento-hover);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cat-prod-lista {
  display: none;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cat-prod-tarjeta {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.8rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;
}

.cat-prod-tarjeta:hover,
.cat-prod-tarjeta:focus-visible {
  border-color: var(--color-acento-borde);
  background: var(--color-fila-hover);
  outline: none;
}

.cat-prod-tarjeta--lectura {
  cursor: default;
}

.cat-prod-tarjeta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.cat-prod-tarjeta-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-texto-suave);
  line-height: 1.4;
  word-break: break-word;
}

.cat-prod-tarjeta-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.35rem;
  margin-top: 0.1rem;
  border-top: 1px solid var(--color-borde);
}

.cat-prod-tarjeta-total-etiq {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.cat-prod-tarjeta-total strong {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-acento-hover);
}

.cat-prod-vacio {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .pg-marco--catalogo .pg-barra {
    margin-inline: 0.45rem;
  }

  .pg-marco--catalogo .pg-resumen {
    margin-inline: 0.45rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .cat-prod-movil.pg-tabla-cuerpo {
    display: flex;
    padding-inline: 0.45rem;
    overflow-x: visible;
  }

  .cat-prod-escritorio {
    display: none;
  }

  .cat-prod-lista {
    display: flex;
  }
}
</style>
