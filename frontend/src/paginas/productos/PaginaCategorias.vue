<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { onMounted, reactive, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useCatalogoStore } from '../../stores/catalogo';
import type { Categoria } from '../../tipos/catalogo';

const catalogo = useCatalogoStore();
const { categorias } = storeToRefs(catalogo);

const refDialogo = useTemplateRef('refDialogo');

const formulario = reactive({ nombre: '', descripcion: '' });
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

function guardar() {
  const nombre = formulario.nombre.trim();
  if (!nombre) {
    mostrarToast('El nombre es obligatorio.', 'error');
    return;
  }
  const descripcion = formulario.descripcion.trim();
  if (idEdicion.value) {
    catalogo.actualizarCategoria(idEdicion.value, { nombre, descripcion });
    mostrarToast('Categoría actualizada.', 'ok');
  } else {
    catalogo.agregarCategoria({ nombre, descripcion });
    mostrarToast('Categoría creada.', 'ok');
  }
  cerrarModal();
  resetFormulario();
}

function borrar(c: Categoria) {
  if (!globalThis.confirm(`¿Borrar la categoría «${c.nombre}»?`)) return;
  const ok = catalogo.eliminarCategoria(c.id);
  if (!ok) {
    mostrarToast('No se puede borrar: hay productos que usan esta categoría.', 'error');
    return;
  }
  mostrarToast('Categoría borrada.', 'ok');
}

onMounted(() => {
  resetFormulario();
});
</script>

<template>
  <section class="pagina" aria-labelledby="titulo-cat">
    <header class="cabecera">
      <h1 id="titulo-cat" class="titulo">Categorías</h1>
      <p class="subtitulo">
        Registro de categorías. No se puede borrar una categoría si hay productos asignados; modifica esos productos antes.
      </p>
    </header>

    <div class="barra-acciones">
      <p v-if="mensajeToast" class="toast" :class="tipoMensajeToast" role="status">
        {{ mensajeToast }}
      </p>
      <button type="button" class="boton primario" @click="abrirNuevo">
        <Plus :size="18" stroke-width="2" aria-hidden="true" />
        Nueva categoría
      </button>
    </div>

    <div class="envoltorio-tabla" role="region" aria-label="Listado de categorías">
      <table class="tabla">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Descripción</th>
            <th scope="col" class="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in categorias" :key="c.id">
            <td>{{ c.nombre }}</td>
            <td class="celda-suave">{{ c.descripcion || '—' }}</td>
            <td class="col-acciones">
              <div class="grupo-botones">
                <button type="button" class="boton-mini" @click="abrirModificar(c)">Alta</button>
                <button type="button" class="boton-mini peligro" @click="borrar(c)">Borrado</button>
              </div>
            </td>
          </tr>
          <tr v-if="categorias.length === 0">
            <td colspan="3" class="vacía">
              No hay categorías. Pulsa <strong>Nueva categoría</strong> para agregar la primera.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog ref="refDialogo" class="modal" @close="alCerrarDialogo">
      <div class="modal-panel" @click.stop>
        <h2 id="titulo-modal-cat" class="modal-titulo">{{ tituloModal() }}</h2>
        <form class="formulario" @submit.prevent="guardar">
          <div class="fila">
            <label class="etiqueta" for="modal-cat-nombre">Nombre</label>
            <input
              id="modal-cat-nombre"
              v-model="formulario.nombre"
              type="text"
              class="entrada"
              required
              maxlength="120"
              autocomplete="off"
            />
          </div>
          <div class="fila">
            <label class="etiqueta" for="modal-cat-desc">Descripción</label>
            <textarea
              id="modal-cat-desc"
              v-model="formulario.descripcion"
              class="entrada area"
              rows="3"
              maxlength="500"
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
  max-width: 42rem;
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

.celda-suave {
  color: var(--color-texto-suave);
}

.col-acciones {
  width: 1%;
  white-space: nowrap;
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
  width: 24rem;
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
  min-height: 5rem;
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
