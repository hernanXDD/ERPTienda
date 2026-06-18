<script setup lang="ts">
import { FolderTree, Package, Plus, RefreshCw, Tags, X } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import { useCatalogoStore } from '../../stores/catalogo';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import type { Categoria } from '../../tipos/catalogo';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('productos-categorias');

const catalogo = useCatalogoStore();
const { categorias, productos } = storeToRefs(catalogo);
const { tienePermiso } = usePermisosOperador();
const puedeGestionarCatalogo = computed(() => tienePermiso('puedeGestionarCatalogoProductos'));

const refDialogo = useTemplateRef('refDialogo');

const formulario = reactive({ nombre: '', descripcion: '' });
const idEdicion = ref<string | null>(null);
const busqueda = ref('');
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

const cantidadProductosPorCategoria = computed(() => {
  const mapa = new Map<string, number>();
  for (const p of productos.value) {
    mapa.set(p.categoriaId, (mapa.get(p.categoriaId) ?? 0) + 1);
  }
  return mapa;
});

const categoriasConProductos = computed(() => {
  let total = 0;
  for (const c of categorias.value) {
    if ((cantidadProductosPorCategoria.value.get(c.id) ?? 0) > 0) total += 1;
  }
  return total;
});

const categoriasOrdenadas = computed(() =>
  [...categorias.value].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
  ),
);

const categoriasFiltradas = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  if (!texto) return categoriasOrdenadas.value;
  return categoriasOrdenadas.value.filter((c) => {
    const agregado = `${c.nombre} ${c.descripcion}`.toLowerCase();
    return agregado.includes(texto);
  });
});

const hayFiltrosActivos = computed(() => Boolean(busqueda.value.trim()));

function limpiarFiltros(): void {
  busqueda.value = '';
}

function cantidadProductosEnCategoria(categoriaId: string): number {
  return cantidadProductosPorCategoria.value.get(categoriaId) ?? 0;
}

function resumenDescripcion(texto: string): string {
  const t = texto.trim();
  if (!t) return '—';
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

function mostrarToast(texto: string, tipo: 'error' | 'ok') {
  mensajeToast.value = texto;
  tipoMensajeToast.value = tipo;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, 4000);
}

function resetFormulario() {
  formulario.nombre = '';
  formulario.descripcion = '';
  idEdicion.value = null;
}

function tituloModal() {
  return idEdicion.value ? 'Modificar categoría' : 'Nueva categoría';
}

function abrirNuevo() {
  resetFormulario();
  refDialogo.value?.showModal();
}

function abrirModificar(c: Categoria) {
  idEdicion.value = c.id;
  formulario.nombre = c.nombre;
  formulario.descripcion = c.descripcion;
  refDialogo.value?.showModal();
}

function cerrarModal() {
  refDialogo.value?.close();
}

function alCerrarDialogo() {
  resetFormulario();
}

async function guardar() {
  const nombre = formulario.nombre.trim();
  if (!nombre) {
    mostrarToast('El nombre es obligatorio.', 'error');
    return;
  }
  const descripcion = formulario.descripcion.trim();
  try {
    if (idEdicion.value) {
      await catalogo.actualizarCategoria(idEdicion.value, { nombre, descripcion });
      mostrarToast('Categoría actualizada.', 'ok');
    } else {
      await catalogo.agregarCategoria({ nombre, descripcion });
      mostrarToast('Categoría creada.', 'ok');
    }
    cerrarModal();
    resetFormulario();
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo guardar la categoría.'), 'error');
  }
}

async function borrar(c: Categoria) {
  if (!globalThis.confirm(`¿Borrar la categoría «${c.nombre}»?`)) return;
  try {
    const ok = await catalogo.eliminarCategoria(c.id);
    if (!ok) {
      mostrarToast('No se puede borrar: hay productos que usan esta categoría.', 'error');
      return;
    }
    mostrarToast('Categoría borrada.', 'ok');
  } catch (error) {
    mostrarToast(mensajeErrorHttp(error, 'No se pudo borrar la categoría.'), 'error');
  }
}

onMounted(() => {
  resetFormulario();
});
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-cat">
    <div class="pg-marco pg-marco--categorias">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Tags :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Productos · Catálogo</p>
              <h1 id="titulo-cat" class="pg-titulo">Categorías</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
        <div class="pg-kpis" aria-label="Resumen de categorías">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Categorías</span>
            <span class="pg-kpi-valor pg-mono">{{ categorias.length }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Con productos</span>
            <span class="pg-kpi-valor pg-mono">{{ categoriasConProductos }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Productos en catálogo</span>
            <span class="pg-kpi-valor pg-mono">{{ productos.length }}</span>
          </div>
        </div>
      </header>

      <p v-if="!puedeGestionarCatalogo" class="cat-gest-banner-lectura" role="status">
        Tenés acceso de lectura. Para crear o modificar categorías necesitás el permiso de gestión de
        catálogo.
      </p>

      <div class="pg-barra">
        <div class="pg-barra-fila">
          <div class="pg-barra-col pg-barra-col--busq">
            <label class="pg-filtro-etiq" for="cat-gest-busq">Buscar</label>
            <input
              id="cat-gest-busq"
              v-model="busqueda"
              type="search"
              class="pg-filtro-inp"
              placeholder="Nombre o descripción…"
              autocomplete="off"
            />
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
              class="pg-btn-primario cat-gest-btn-nuevo"
              @click="abrirNuevo"
            >
              <Plus :size="18" stroke-width="2" aria-hidden="true" />
              Nueva categoría
            </button>
          </div>
        </div>
        <p
          v-if="mensajeToast"
          class="cat-gest-aviso"
          :class="`cat-gest-aviso--${tipoMensajeToast}`"
          role="status"
        >
          {{ mensajeToast }}
        </p>
      </div>

      <p class="pg-resumen pg-resumen--flex" role="status">
        <span>
          Mostrando <strong>{{ categoriasFiltradas.length }}</strong>
          {{ categoriasFiltradas.length === 1 ? 'categoría' : 'categorías' }}
          <template v-if="hayFiltrosActivos"> (filtros activos)</template>
        </span>
        <span v-if="categorias.length > 0">
          Total registradas: <strong>{{ categorias.length }}</strong>
        </span>
      </p>

      <section class="pg-tabla-cuerpo" role="region" aria-label="Listado de categorías">
        <div class="pg-tabla-cab">
          <h2 class="pg-tabla-h2">Categorías registradas</h2>
          <span class="pg-tabla-meta pg-mono">{{ categoriasFiltradas.length }} filas</span>
        </div>

        <ul
          v-if="categoriasFiltradas.length > 0"
          class="cat-gest-lista"
          role="list"
          aria-label="Categorías filtradas"
        >
          <li v-for="c in categoriasFiltradas" :key="c.id" role="listitem">
            <button
              v-if="puedeGestionarCatalogo"
              type="button"
              class="cat-gest-tarjeta"
              @click="abrirModificar(c)"
            >
              <div class="cat-gest-cel-nombre">
                <span class="cat-gest-nombre">{{ c.nombre }}</span>
                <span class="cat-gest-chip">
                  <FolderTree :size="12" aria-hidden="true" />
                  Tipo de producto
                </span>
              </div>
              <p
                v-if="c.descripcion.trim()"
                class="cat-gest-tarjeta-desc"
                :title="c.descripcion.trim()"
              >
                {{ resumenDescripcion(c.descripcion) }}
              </p>
              <div class="cat-gest-tarjeta-total">
                <span class="cat-gest-tarjeta-total-etiq">Productos</span>
                <span
                  class="cat-gest-contador"
                  :class="{ 'cat-gest-contador--vacio': cantidadProductosEnCategoria(c.id) === 0 }"
                >
                  <Package :size="13" aria-hidden="true" />
                  <span class="pg-mono">{{ cantidadProductosEnCategoria(c.id) }}</span>
                </span>
              </div>
            </button>
            <article v-else class="cat-gest-tarjeta cat-gest-tarjeta--lectura">
              <div class="cat-gest-cel-nombre">
                <span class="cat-gest-nombre">{{ c.nombre }}</span>
                <span class="cat-gest-chip">
                  <FolderTree :size="12" aria-hidden="true" />
                  Tipo de producto
                </span>
              </div>
              <p
                v-if="c.descripcion.trim()"
                class="cat-gest-tarjeta-desc"
                :title="c.descripcion.trim()"
              >
                {{ resumenDescripcion(c.descripcion) }}
              </p>
              <div class="cat-gest-tarjeta-total">
                <span class="cat-gest-tarjeta-total-etiq">Productos</span>
                <span
                  class="cat-gest-contador"
                  :class="{ 'cat-gest-contador--vacio': cantidadProductosEnCategoria(c.id) === 0 }"
                >
                  <Package :size="13" aria-hidden="true" />
                  <span class="pg-mono">{{ cantidadProductosEnCategoria(c.id) }}</span>
                </span>
              </div>
            </article>
          </li>
        </ul>
        <p v-else class="cat-gest-vacio" role="status">
          <template v-if="categorias.length === 0">
            No hay categorías cargadas. Usá <strong>Nueva categoría</strong> para agregar la primera.
          </template>
          <template v-else>
            Ninguna categoría coincide con la búsqueda.
            <button type="button" class="cat-gest-link-vacio" @click="limpiarFiltros">
              Limpiar filtros
            </button>
          </template>
        </p>

        <div class="pg-tabla-scroll cat-gest-tabla-scroll--escritorio">
          <table class="pg-tabla pg-tabla--estado">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Descripción</th>
                <th scope="col" class="pg-der">Productos</th>
                <th v-if="puedeGestionarCatalogo" scope="col" class="pg-acc">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in categoriasFiltradas" :key="c.id">
                <td>
                  <div class="cat-gest-cel-nombre">
                    <span class="cat-gest-nombre">{{ c.nombre }}</span>
                    <span class="cat-gest-chip">
                      <FolderTree :size="12" aria-hidden="true" />
                      Tipo de producto
                    </span>
                  </div>
                </td>
                <td class="cat-gest-cel-desc" :title="c.descripcion.trim() || undefined">
                  {{ resumenDescripcion(c.descripcion) }}
                </td>
                <td class="pg-der">
                  <span
                    class="cat-gest-contador"
                    :class="{ 'cat-gest-contador--vacio': cantidadProductosEnCategoria(c.id) === 0 }"
                  >
                    <Package :size="13" aria-hidden="true" />
                    <span class="pg-mono">{{ cantidadProductosEnCategoria(c.id) }}</span>
                  </span>
                </td>
                <td v-if="puedeGestionarCatalogo" class="pg-acc">
                  <div class="cat-gest-acciones">
                    <button type="button" class="pg-btn" @click="abrirModificar(c)">
                      Editar
                    </button>
                    <button
                      type="button"
                      class="pg-btn cat-gest-btn-peligro"
                      :disabled="cantidadProductosEnCategoria(c.id) > 0"
                      :title="
                        cantidadProductosEnCategoria(c.id) > 0
                          ? 'Hay productos asignados a esta categoría'
                          : undefined
                      "
                      @click="borrar(c)"
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="categoriasFiltradas.length === 0">
                <td colspan="4" class="pg-vacio">
                  <template v-if="categorias.length === 0">
                    No hay categorías cargadas. Usá <strong>Nueva categoría</strong> para agregar la
                    primera.
                  </template>
                  <template v-else>
                    Ninguna categoría coincide con la búsqueda.
                    <button type="button" class="cat-gest-link-vacio" @click="limpiarFiltros">
                      Limpiar filtros
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <dialog ref="refDialogo" class="cat-gest-modal" @close="alCerrarDialogo">
      <div class="cat-gest-modal-panel" @click.stop>
        <header class="cat-gest-modal-cap">
          <div>
            <h2 id="titulo-modal-cat" class="cat-gest-modal-titulo">{{ tituloModal() }}</h2>
            <p class="cat-gest-modal-sub">
              El nombre identifica el tipo en listados y filtros del catálogo.
            </p>
          </div>
          <button type="button" class="cat-gest-modal-x" aria-label="Cerrar" @click="cerrarModal">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <form class="cat-gest-formulario" @submit.prevent="guardar">
          <section class="cat-gest-seccion" aria-labelledby="cat-gest-sec-datos">
            <h3 id="cat-gest-sec-datos" class="cat-gest-seccion-tit">Datos de la categoría</h3>
            <div class="cat-gest-campo">
              <label class="pg-filtro-etiq" for="modal-cat-nombre">Nombre</label>
              <input
                id="modal-cat-nombre"
                v-model="formulario.nombre"
                type="text"
                class="pg-filtro-inp"
                required
                maxlength="120"
                autocomplete="off"
                placeholder="Ej. Remera, Buzo, Calzado…"
              />
            </div>
            <div class="cat-gest-campo">
              <label class="pg-filtro-etiq" for="modal-cat-desc">Descripción</label>
              <textarea
                id="modal-cat-desc"
                v-model="formulario.descripcion"
                class="pg-filtro-inp cat-gest-textarea"
                rows="3"
                maxlength="500"
                placeholder="Detalle opcional para el equipo (no se muestra en ventas)…"
              />
            </div>
          </section>

          <footer class="cat-gest-modal-pie">
            <button type="button" class="pg-btn pg-btn--ghost pg-btn--lg" @click="cerrarModal">
              Cancelar
            </button>
            <button type="submit" class="pg-btn-primario">Guardar categoría</button>
          </footer>
        </form>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.cat-gest-banner-lectura {
  margin: 0 0 1rem;
  padding: 0.65rem 0.82rem;
  border-radius: 10px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}
.pg-marco--categorias {
  --pg-reserva-vertical-vista: clamp(13rem, 26dvh, 19rem);
}

.cat-gest-btn-nuevo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  justify-content: center;
}

@media (min-width: 720px) {
  .cat-gest-btn-nuevo {
    width: auto;
  }
}

.cat-gest-aviso {
  flex: 1 1 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.cat-gest-aviso--ok {
  color: var(--color-exito);
  background: var(--color-exito-suave);
  border: 1px solid var(--color-exito-borde);
}

.cat-gest-aviso--error {
  color: var(--color-peligro);
  background: var(--color-peligro-suave);
  border: 1px solid var(--color-peligro-borde);
}

.cat-gest-cel-nombre {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 8rem;
}

.cat-gest-nombre {
  font-weight: 600;
  color: var(--color-texto);
  line-height: 1.25;
}

.cat-gest-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  width: fit-content;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-texto-apagado);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-acento-borde);
}

.cat-gest-cel-desc {
  max-width: 22rem;
  color: var(--color-texto-suave);
  font-size: 0.84rem;
  line-height: 1.45;
}

.cat-gest-contador {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-texto);
}

.cat-gest-contador--vacio {
  color: var(--color-texto-apagado);
  font-weight: 500;
}

.cat-gest-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.cat-gest-btn-peligro {
  border-color: var(--color-peligro-borde);
  color: var(--color-peligro);
}

.cat-gest-btn-peligro:hover:not(:disabled) {
  background: var(--color-peligro-suave);
  border-color: var(--color-peligro-borde);
}

.cat-gest-btn-peligro:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cat-gest-link-vacio {
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

.cat-gest-modal {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 1.25rem);
  width: min(26rem, 100%);
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: var(--sombra-suave);
}

.cat-gest-modal::backdrop {
  background: var(--color-scrim);
}

.cat-gest-modal-panel {
  display: flex;
  flex-direction: column;
  max-height: min(88dvh, 36rem);
}

.cat-gest-modal-cap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.15rem clamp(1rem, 3vw, 1.35rem) 0.85rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cat-gest-modal-titulo {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.cat-gest-modal-sub {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.cat-gest-modal-x {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  cursor: pointer;
}

.cat-gest-modal-x:hover {
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.cat-gest-formulario {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: auto;
  padding: 0 clamp(1rem, 3vw, 1.35rem) 1.25rem;
}

.cat-gest-seccion {
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cat-gest-seccion-tit {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-texto-apagado);
}

.cat-gest-campo {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
}

.cat-gest-textarea {
  resize: vertical;
  min-height: 5.5rem;
}

.cat-gest-modal-pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-borde);
  position: sticky;
  bottom: 0;
  background: var(--color-fondo-elevado);
}

.cat-gest-lista {
  display: none;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cat-gest-tarjeta {
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

.cat-gest-tarjeta:hover,
.cat-gest-tarjeta:focus-visible {
  border-color: var(--color-acento-borde);
  background: var(--color-fila-hover);
  outline: none;
}

.cat-gest-tarjeta--lectura {
  cursor: default;
}

.cat-gest-tarjeta-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-texto-suave);
  line-height: 1.4;
  word-break: break-word;
}

.cat-gest-tarjeta-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.35rem;
  margin-top: 0.1rem;
  border-top: 1px solid var(--color-borde);
}

.cat-gest-tarjeta-total-etiq {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.cat-gest-vacio {
  display: none;
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .pg-marco--categorias .pg-tabla-cuerpo {
    overflow-x: visible;
  }

  .cat-gest-tabla-scroll--escritorio {
    display: none;
  }

  .cat-gest-lista,
  .cat-gest-vacio {
    display: flex;
  }
}
</style>
