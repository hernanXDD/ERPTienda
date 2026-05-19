<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useCatalogoStore } from '../../stores/catalogo';
import { useStockStore } from '../../stores/stock';
import type { Producto } from '../../tipos/catalogo';

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const catalogo = useCatalogoStore();
const stockStore = useStockStore();
const { categorias, productos } = storeToRefs(catalogo);

const refDialogo = useTemplateRef('refDialogo');

const productosOrdenados = computed(() => {
  return [...productos.value].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );
});

const formulario = reactive({
  nombre: '',
  tipoPrenda: '',
  marca: '',
  descripcion: '',
  categoriaId: '',
  codigoBarras: '',
  precioVenta: '' as string | number,
});

const idEdicion = ref<string | null>(null);
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

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
  formulario.tipoPrenda = '';
  formulario.marca = '';
  formulario.descripcion = '';
  formulario.categoriaId = categorias.value[0]?.id ?? '';
  formulario.codigoBarras = '';
  formulario.precioVenta = '';
  idEdicion.value = null;
}

function tituloModal() {
  return idEdicion.value ? 'Modificar producto' : 'Nuevo producto';
}

function abrirNuevo() {
  resetFormulario();
  refDialogo.value?.showModal();
}

function abrirModificar(p: Producto) {
  idEdicion.value = p.id;
  formulario.nombre = p.nombre;
  formulario.tipoPrenda = p.tipoPrenda;
  formulario.marca = p.marca;
  formulario.descripcion = p.descripcion;
  formulario.categoriaId = p.categoriaId;
  formulario.codigoBarras = p.codigoBarras;
  formulario.precioVenta = p.precioVenta;
  refDialogo.value?.showModal();
}

function cerrarModal() {
  refDialogo.value?.close();
}

function alCerrarDialogo() {
  resetFormulario();
}

function guardar() {
  const nombre = formulario.nombre.trim();
  const tipoPrenda = formulario.tipoPrenda.trim();
  const marca = formulario.marca.trim();
  if (!nombre || !tipoPrenda || !marca) {
    mostrarToast('Completá nombre, tipo de prenda y marca.', 'error');
    return;
  }
  if (!formulario.categoriaId) {
    mostrarToast('Elegí una categoría.', 'error');
    return;
  }
  const precio =
    typeof formulario.precioVenta === 'number'
      ? formulario.precioVenta
      : Number(String(formulario.precioVenta).replace(',', '.'));
  if (!Number.isFinite(precio) || precio < 0) {
    mostrarToast('Indicá un precio de venta válido (mayor o igual a 0).', 'error');
    return;
  }
  const codigoBarras = formulario.codigoBarras.trim();
  const descripcion = formulario.descripcion.trim();
  const datos = {
    nombre,
    tipoPrenda,
    marca,
    descripcion,
    categoriaId: formulario.categoriaId,
    codigoBarras,
    precioVenta: precio,
  };
  if (idEdicion.value) {
    catalogo.actualizarProducto(idEdicion.value, datos);
    mostrarToast('Producto actualizado.', 'ok');
  } else {
    const nuevoProducto = catalogo.agregarProducto(datos);
    stockStore.inicializarExistenciaParaProducto(nuevoProducto.id);
    mostrarToast('Producto creado.', 'ok');
  }
  cerrarModal();
  resetFormulario();
}

function borrar(p: Producto) {
  if (!globalThis.confirm(`¿Borrar el producto «${p.nombre}»?`)) return;
  catalogo.eliminarProducto(p.id);
  stockStore.quitarProducto(p.id);
  mostrarToast('Producto borrado.', 'ok');
}

onMounted(() => {
  resetFormulario();
});
</script>

<template>
  <section class="pagina" aria-labelledby="titulo-prod">
    <header class="cabecera">
      <h1 id="titulo-prod" class="titulo">Catálogo de productos</h1>
      <p class="subtitulo">
        Listado de productos. Para existencias físicas disponibles usá el menú <strong>Stock</strong>. Las variantes por talle/color se trabajarán en una etapa posterior.
      </p>
    </header>

    <div class="barra-acciones">
      <p v-if="mensajeToast" class="toast" :class="tipoMensajeToast" role="status">
        {{ mensajeToast }}
      </p>
      <button type="button" class="boton primario" @click="abrirNuevo">
        <Plus :size="18" stroke-width="2" aria-hidden="true" />
        Nuevo producto
      </button>
    </div>

    <div class="envoltorio-tabla" role="region" aria-label="Listado de productos">
      <table class="tabla">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Tipo</th>
            <th scope="col">Marca</th>
            <th scope="col">Categoría</th>
            <th scope="col" class="col-corta">Código</th>
            <th scope="col" class="col-precio der">Precio</th>
            <th scope="col" class="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in productosOrdenados" :key="p.id">
            <td>{{ p.nombre }}</td>
            <td>{{ p.tipoPrenda }}</td>
            <td>{{ p.marca }}</td>
            <td>{{ catalogo.nombreCategoria(p.categoriaId) }}</td>
            <td class="col-corta codigo">{{ p.codigoBarras || '—' }}</td>
            <td class="col-precio der">{{ formatoPeso.format(p.precioVenta) }}</td>
            <td class="col-acciones">
              <div class="grupo-botones">
                <button type="button" class="boton-mini" @click="abrirModificar(p)">Alta</button>
                <button type="button" class="boton-mini peligro" @click="borrar(p)">Borrado</button>
              </div>
            </td>
          </tr>
          <tr v-if="productosOrdenados.length === 0">
            <td colspan="7" class="vacía">
              No hay productos. Pulsa <strong>Nuevo producto</strong> para agregar el primero.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog ref="refDialogo" class="modal" @close="alCerrarDialogo">
      <div class="modal-panel" @click.stop>
        <h2 id="titulo-modal-prod" class="modal-titulo">{{ tituloModal() }}</h2>
        <form class="formulario" @submit.prevent="guardar">
          <div class="rejilla">
            <div class="fila">
              <label class="etiqueta" for="modal-prod-nombre">Nombre</label>
              <input
                id="modal-prod-nombre"
                v-model="formulario.nombre"
                type="text"
                class="entrada"
                required
                maxlength="200"
                autocomplete="off"
              />
            </div>
            <div class="fila">
              <label class="etiqueta" for="modal-prod-tipo">Tipo de prenda</label>
              <input
                id="modal-prod-tipo"
                v-model="formulario.tipoPrenda"
                type="text"
                class="entrada"
                required
                maxlength="80"
                placeholder="Ej. Remera, campera"
              />
            </div>
            <div class="fila">
              <label class="etiqueta" for="modal-prod-marca">Marca</label>
              <input
                id="modal-prod-marca"
                v-model="formulario.marca"
                type="text"
                class="entrada"
                required
                maxlength="120"
              />
            </div>
            <div class="fila">
              <label class="etiqueta" for="modal-prod-precio">Precio de venta</label>
              <input
                id="modal-prod-precio"
                v-model="formulario.precioVenta"
                type="number"
                class="entrada"
                required
                min="0"
                step="1"
                inputmode="decimal"
                placeholder="0"
              />
            </div>
            <div class="fila">
              <label class="etiqueta" for="modal-prod-cat">Categoría</label>
              <select id="modal-prod-cat" v-model="formulario.categoriaId" class="entrada" required>
                <option disabled value="">Seleccionar…</option>
                <option v-for="c in categorias" :key="c.id" :value="c.id">
                  {{ c.nombre }}
                </option>
              </select>
            </div>
          </div>
          <div class="fila">
            <label class="etiqueta" for="modal-prod-ean">Código de barras</label>
            <input
              id="modal-prod-ean"
              v-model="formulario.codigoBarras"
              type="text"
              class="entrada"
              maxlength="48"
              inputmode="numeric"
              autocomplete="off"
              placeholder="Opcional — EAN, UPC o interno"
            />
          </div>
          <div class="fila">
            <label class="etiqueta" for="modal-prod-desc">Descripción</label>
            <textarea
              id="modal-prod-desc"
              v-model="formulario.descripcion"
              class="entrada area"
              rows="3"
              maxlength="1000"
            />
          </div>
          <div class="modal-pie">
            <button type="button" class="boton secundario" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="boton primario">Guardar</button>
          </div>
        </form>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.pagina {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cabecera {
  margin: 0;
}

.titulo {
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
  font-weight: 600;
}

.subtitulo {
  margin: 0;
  color: var(--color-texto-apagado);
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 44rem;
}

.barra-acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.toast {
  flex: 1;
  min-width: 12rem;
  margin: 0;
  font-size: 0.875rem;
}

.toast.ok {
  color: var(--color-exito);
}

.toast.error {
  color: var(--color-peligro);
}

.boton {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border-radius: var(--radio-control);
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
}

.boton.primario {
  background: var(--color-acento);
  color: var(--color-texto-sobre-acento);
}

.boton.primario:hover {
  background: var(--color-acento-hover);
}

.boton.secundario {
  background: transparent;
  border-color: var(--color-borde);
  color: var(--color-texto-suave);
}

.boton.secundario:hover {
  color: var(--color-texto);
}

.envoltorio-tabla {
  overflow-x: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.tabla th,
.tabla td {
  padding: 0.65rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.tabla thead th {
  font-weight: 600;
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
}

.col-acciones {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

.col-corta {
  max-width: 7.5rem;
}

.codigo {
  font-variant-numeric: tabular-nums;
  font-size: 0.82rem;
  color: var(--color-texto-apagado);
}

.col-precio {
  white-space: nowrap;
}

.der {
  text-align: right;
}

.grupo-botones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.boton-mini {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--color-borde);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-texto-suave);
  cursor: pointer;
}

.boton-mini:hover {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.08);
}

.boton-mini.peligro {
  border-color: rgba(248, 113, 113, 0.45);
  color: var(--color-peligro);
}

.boton-mini.peligro:hover {
  background: rgba(248, 113, 113, 0.1);
}

.vacía {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
}

.modal {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: 28rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.55);
}

.modal-panel {
  padding: 1.25rem 1.35rem 1.35rem;
}

.modal-titulo {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rejilla {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .rejilla {
    grid-template-columns: repeat(2, 1fr);
  }

  .formulario .fila:last-of-type {
    grid-column: 1 / -1;
  }
}

.fila {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.etiqueta {
  font-size: 0.82rem;
  color: var(--color-texto-suave);
}

.entrada {
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  padding: 0.5rem 0.6rem;
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
}

.area {
  resize: vertical;
  min-height: 4rem;
}

.modal-pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-borde);
}
</style>
