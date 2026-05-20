<script setup lang="ts">
import { Package, Plus, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { etiquetaTalleColor } from '../../modulos/catalogo/catalogoPresentacion';
import { useCatalogoStore } from '../../stores/catalogo';
import { useStockStore } from '../../stores/stock';
import type { Producto, Variante } from '../../tipos/catalogo';

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const catalogo = useCatalogoStore();
const stockStore = useStockStore();
const { categorias, productos } = storeToRefs(catalogo);

const refDialogo = useTemplateRef('refDialogo');

interface BorradorVariante {
  claveLocal: string;
  id?: string;
  talle: string;
  color: string;
  codigoBarras: string;
}

const formulario = reactive({
  nombre: '',
  marca: '',
  descripcion: '',
  categoriaId: '',
  precioVenta: '' as string | number,
});

const variantesBorrador = ref<BorradorVariante[]>([]);
const idEdicion = ref<string | null>(null);
const mensajeToast = ref('');
const tipoMensajeToast = ref<'error' | 'ok'>('ok');
let idToast: ReturnType<typeof setTimeout> | null = null;

const productosOrdenados = computed(() => {
  return [...productos.value].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );
});

function mostrarToast(texto: string, tipo: 'error' | 'ok') {
  mensajeToast.value = texto;
  tipoMensajeToast.value = tipo;
  if (idToast) clearTimeout(idToast);
  idToast = setTimeout(() => {
    mensajeToast.value = '';
  }, 4000);
}

function nuevaClaveLocal(): string {
  return crypto.randomUUID();
}

function filaVarianteVacia(): BorradorVariante {
  return { claveLocal: nuevaClaveLocal(), talle: '', color: '', codigoBarras: '' };
}

function resetFormulario() {
  formulario.nombre = '';
  formulario.marca = '';
  formulario.descripcion = '';
  formulario.categoriaId = categorias.value[0]?.id ?? '';
  formulario.precioVenta = '';
  variantesBorrador.value = [filaVarianteVacia()];
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
  formulario.marca = p.marca;
  formulario.descripcion = p.descripcion;
  formulario.categoriaId = p.categoriaId;
  formulario.precioVenta = p.precioVenta;
  const existentes = catalogo.todasVariantesDeProducto(p.id);
  variantesBorrador.value =
    existentes.length > 0
      ? existentes.map((v) => ({
          claveLocal: nuevaClaveLocal(),
          id: v.id,
          talle: v.talle,
          color: v.color,
          codigoBarras: v.codigoBarras,
        }))
      : [filaVarianteVacia()];
  refDialogo.value?.showModal();
}

function agregarFilaVariante() {
  variantesBorrador.value = [...variantesBorrador.value, filaVarianteVacia()];
}

function quitarFilaVariante(claveLocal: string) {
  if (variantesBorrador.value.length <= 1) {
    mostrarToast('El producto debe tener al menos una variante (talle y color).', 'error');
    return;
  }
  variantesBorrador.value = variantesBorrador.value.filter((f) => f.claveLocal !== claveLocal);
}

function cerrarModal() {
  refDialogo.value?.close();
}

function alCerrarDialogo() {
  resetFormulario();
}

function cantidadVariantesProducto(productoId: string): number {
  return catalogo.cantidadVariantesActivas(productoId);
}

function validarVariantesBorrador(): BorradorVariante[] | null {
  const validas: BorradorVariante[] = [];
  const claves = new Set<string>();
  for (const fila of variantesBorrador.value) {
    const talle = fila.talle.trim();
    const color = fila.color.trim();
    if (!talle || !color) {
      mostrarToast('Cada variante necesita talle y color.', 'error');
      return null;
    }
    const clave = `${talle.toLowerCase()}|${color.toLowerCase()}`;
    if (claves.has(clave)) {
      mostrarToast('No puede haber dos variantes con el mismo talle y color.', 'error');
      return null;
    }
    claves.add(clave);
    validas.push({ ...fila, talle, color, codigoBarras: fila.codigoBarras.trim() });
  }
  if (validas.length === 0) {
    mostrarToast('Agregá al menos una variante.', 'error');
    return null;
  }
  return validas;
}

function persistirVariantes(productoId: string, filas: BorradorVariante[]): boolean {
  const idsEnFormulario = new Set(filas.filter((f) => f.id).map((f) => f.id as string));
  const actuales = catalogo.todasVariantesDeProducto(productoId);

  for (const existente of actuales) {
    if (!idsEnFormulario.has(existente.id)) {
      const ok = catalogo.eliminarVariante(existente.id);
      if (!ok) {
        mostrarToast('No se puede quitar la única variante activa del producto.', 'error');
        return false;
      }
      stockStore.quitarVariante(existente.id);
    }
  }

  for (const fila of filas) {
    const datos: Omit<Variante, 'id'> = {
      productoId,
      talle: fila.talle,
      color: fila.color,
      codigoBarras: fila.codigoBarras,
      activa: true,
    };
    if (fila.id) {
      const ok = catalogo.actualizarVariante(fila.id, datos);
      if (!ok) {
        mostrarToast('Ya existe otra variante con ese talle y color.', 'error');
        return false;
      }
    } else {
      const creada = catalogo.agregarVariante(datos);
      if (!creada) {
        mostrarToast('Ya existe una variante con ese talle y color.', 'error');
        return false;
      }
      stockStore.inicializarExistenciaParaVariante(creada.id);
    }
  }
  return true;
}

function guardar() {
  const nombre = formulario.nombre.trim();
  const marca = formulario.marca.trim();
  if (!nombre || !marca) {
    mostrarToast('Completá nombre y marca.', 'error');
    return;
  }
  if (!formulario.categoriaId) {
    mostrarToast('Elegí una categoría (tipo de producto).', 'error');
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

  const filasVariante = validarVariantesBorrador();
  if (!filasVariante) return;

  const datosProducto = {
    nombre,
    marca,
    descripcion: formulario.descripcion.trim(),
    categoriaId: formulario.categoriaId,
    precioVenta: precio,
  };

  if (idEdicion.value) {
    catalogo.actualizarProducto(idEdicion.value, datosProducto);
    if (!persistirVariantes(idEdicion.value, filasVariante)) return;
    mostrarToast('Producto y variantes actualizados.', 'ok');
  } else {
    const nuevoProducto = catalogo.agregarProducto(datosProducto);
    if (!persistirVariantes(nuevoProducto.id, filasVariante)) {
      catalogo.eliminarProducto(nuevoProducto.id);
      stockStore.quitarVariantes(
        catalogo.todasVariantesDeProducto(nuevoProducto.id).map((v) => v.id)
      );
      return;
    }
    mostrarToast('Producto creado con sus variantes.', 'ok');
  }
  cerrarModal();
  resetFormulario();
}

function borrar(p: Producto) {
  if (!globalThis.confirm(`¿Borrar el producto «${p.nombre}» y todas sus variantes?`)) return;
  const idsVariantes = catalogo.eliminarProducto(p.id);
  stockStore.quitarVariantes(idsVariantes);
  mostrarToast('Producto borrado.', 'ok');
}

onMounted(() => {
  resetFormulario();
});
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-prod">
    <div class="pg-marco">
    <header class="pg-cab">
      <div class="pg-cab-txt">
        <div class="pg-cab-izq">
          <Package :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
          <div>
            <p class="pg-eyebrow">Productos · Catálogo</p>
            <h1 id="titulo-prod" class="pg-titulo">Catálogo de productos</h1>
            <p class="pg-sub">
              Cada producto pertenece a una categoría (remera, buzo, calzado…) y tiene una o más
              variantes por talle y color. El stock y las ventas operan sobre cada variante.
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="pg-barra pg-barra--acciones">
      <p v-if="mensajeToast" class="toast" :class="tipoMensajeToast" role="status">
        {{ mensajeToast }}
      </p>
      <button type="button" class="boton primario" @click="abrirNuevo">
        <Plus :size="18" stroke-width="2" aria-hidden="true" />
        Nuevo producto
      </button>
    </div>

    <section class="pg-tabla-cuerpo" role="region" aria-label="Listado de productos">
      <div class="pg-tabla-scroll pg-tabla-scroll--libre">
      <table class="pg-tabla pg-tabla--estado">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Marca</th>
            <th scope="col">Categoría</th>
            <th scope="col" class="col-corta der">Variantes</th>
            <th scope="col" class="col-precio der">Precio ref.</th>
            <th scope="col" class="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in productosOrdenados" :key="p.id">
            <td>{{ p.nombre }}</td>
            <td>{{ p.marca }}</td>
            <td>{{ catalogo.nombreCategoria(p.categoriaId) }}</td>
            <td class="col-corta der">{{ cantidadVariantesProducto(p.id) }}</td>
            <td class="col-precio der">{{ formatoPeso.format(p.precioVenta) }}</td>
            <td class="col-acciones">
              <div class="grupo-botones">
                <button type="button" class="boton-mini" @click="abrirModificar(p)">Modificar</button>
                <button type="button" class="boton-mini peligro" @click="borrar(p)">Borrar</button>
              </div>
            </td>
          </tr>
          <tr v-if="productosOrdenados.length === 0">
            <td colspan="6" class="vacía">
              No hay productos. Pulsa <strong>Nuevo producto</strong> para agregar el primero.
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>
    </div>

    <dialog ref="refDialogo" class="modal modal--ancho" @close="alCerrarDialogo">
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
              <label class="etiqueta" for="modal-prod-cat">Categoría (tipo)</label>
              <select id="modal-prod-cat" v-model="formulario.categoriaId" class="entrada" required>
                <option disabled value="">Seleccionar…</option>
                <option v-for="c in categorias" :key="c.id" :value="c.id">
                  {{ c.nombre }}
                </option>
              </select>
            </div>
            <div class="fila">
              <label class="etiqueta" for="modal-prod-precio">Precio de venta (referencia)</label>
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
          </div>
          <div class="fila">
            <label class="etiqueta" for="modal-prod-desc">Descripción</label>
            <textarea
              id="modal-prod-desc"
              v-model="formulario.descripcion"
              class="entrada area"
              rows="2"
              maxlength="1000"
            />
          </div>

          <fieldset class="bloque-variantes">
            <legend class="bloque-variantes-tit">Variantes (talle y color)</legend>
            <p class="bloque-variantes-ayuda">
              Cada fila es una combinación vendible con stock propio. Un producto con un solo talle y
              color tiene una variante.
            </p>
            <div
              v-for="fila in variantesBorrador"
              :key="fila.claveLocal"
              class="fila-variante"
            >
              <div class="fila-variante-campos">
                <label class="etiqueta-mini">
                  Talle
                  <input v-model="fila.talle" type="text" class="entrada" maxlength="24" required />
                </label>
                <label class="etiqueta-mini">
                  Color
                  <input v-model="fila.color" type="text" class="entrada" maxlength="48" required />
                </label>
                <label class="etiqueta-mini etiqueta-mini--cod">
                  Código de barras
                  <input
                    v-model="fila.codigoBarras"
                    type="text"
                    class="entrada"
                    maxlength="48"
                    inputmode="numeric"
                    placeholder="Opcional"
                  />
                </label>
              </div>
              <button
                type="button"
                class="boton-quitar-variante"
                :aria-label="`Quitar variante ${etiquetaTalleColor(fila.talle, fila.color)}`"
                @click="quitarFilaVariante(fila.claveLocal)"
              >
                <Trash2 :size="16" aria-hidden="true" />
              </button>
            </div>
            <button type="button" class="boton secundario boton-agregar-variante" @click="agregarFilaVariante">
              <Plus :size="16" aria-hidden="true" />
              Agregar variante
            </button>
          </fieldset>

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

.modal--ancho {
  width: min(36rem, calc(100vw - 2rem));
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
  min-height: 3rem;
}

.bloque-variantes {
  margin: 0.25rem 0 0;
  padding: 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.bloque-variantes-tit {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0 0.25rem;
}

.bloque-variantes-ayuda {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-texto-apagado);
  line-height: 1.45;
}

.fila-variante {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.fila-variante-campos {
  flex: 1;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr 1fr;
}

@media (min-width: 520px) {
  .fila-variante-campos {
    grid-template-columns: 0.75fr 0.75fr 1.25fr;
  }
}

.etiqueta-mini {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-texto-apagado);
}

.etiqueta-mini--cod {
  grid-column: 1 / -1;
}

@media (min-width: 520px) {
  .etiqueta-mini--cod {
    grid-column: auto;
  }
}

.boton-quitar-variante {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.4);
  background: transparent;
  color: var(--color-peligro);
  cursor: pointer;
}

.boton-agregar-variante {
  align-self: flex-start;
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
