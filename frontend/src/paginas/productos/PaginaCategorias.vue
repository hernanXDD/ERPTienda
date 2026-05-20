<script setup lang="ts">
import { Plus, Tags } from 'lucide-vue-next';
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
  <section class="pg-wrap" aria-labelledby="titulo-cat">
    <div class="pg-marco pg-marco--categorias">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <Tags :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Productos · Catálogo</p>
              <h1 id="titulo-cat" class="pg-titulo">Categorías</h1>
              <p class="pg-sub">
                Registro de categorías. No se puede borrar una categoría si hay productos asignados;
                modifica esos productos antes.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div class="pg-barra">
        <div class="pg-barra-fila">
          <p
            v-if="mensajeToast"
            class="cat-aviso"
            :class="`cat-aviso--${tipoMensajeToast}`"
            role="status"
          >
            {{ mensajeToast }}
          </p>
          <div class="pg-barra-col pg-barra-col--accion">
            <button type="button" class="pg-btn-primario cat-btn-nuevo" @click="abrirNuevo">
              <Plus :size="18" stroke-width="2" aria-hidden="true" />
              Nueva categoría
            </button>
          </div>
        </div>
      </div>

      <p class="pg-resumen" role="status">
        <strong>{{ categorias.length }}</strong>
        {{ categorias.length === 1 ? 'categoría registrada' : 'categorías registradas' }}
      </p>

      <section class="pg-tabla-cuerpo" role="region" aria-label="Listado de categorías">
        <div class="pg-tabla-scroll pg-tabla-scroll--libre">
          <table class="pg-tabla pg-tabla--estado">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Descripción</th>
                <th scope="col" class="pg-acc">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in categorias" :key="c.id">
                <td>{{ c.nombre }}</td>
                <td class="cat-cel-suave">{{ c.descripcion || '—' }}</td>
                <td class="pg-acc">
                  <div class="cat-acciones">
                    <button type="button" class="pg-btn" @click="abrirModificar(c)">Alta</button>
                    <button type="button" class="pg-btn cat-btn-peligro" @click="borrar(c)">
                      Borrado
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="categorias.length === 0">
                <td colspan="3" class="pg-vacio">
                  No hay categorías. Usá <strong>Nueva categoría</strong> para agregar la primera.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <dialog ref="refDialogo" class="cat-modal" @close="alCerrarDialogo">
      <div class="cat-modal-panel" @click.stop>
        <h2 id="titulo-modal-cat" class="cat-modal-titulo">{{ tituloModal() }}</h2>
        <form class="cat-formulario" @submit.prevent="guardar">
          <div class="cat-fila">
            <label class="pg-filtro-etiq" for="modal-cat-nombre">Nombre</label>
            <input
              id="modal-cat-nombre"
              v-model="formulario.nombre"
              type="text"
              class="pg-filtro-inp"
              required
              maxlength="120"
              autocomplete="off"
            />
          </div>
          <div class="cat-fila">
            <label class="pg-filtro-etiq" for="modal-cat-desc">Descripción</label>
            <textarea
              id="modal-cat-desc"
              v-model="formulario.descripcion"
              class="pg-filtro-inp cat-textarea"
              rows="3"
              maxlength="500"
            />
          </div>
          <footer class="cat-modal-pie">
            <button type="button" class="pg-btn pg-btn--ghost" @click="cerrarModal">
              Cancelar
            </button>
            <button type="submit" class="pg-btn-primario">Guardar</button>
          </footer>
        </form>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.pg-marco--categorias {
  --pg-reserva-vertical-vista: clamp(12.5rem, 24dvh, 18rem);
}

.cat-btn-nuevo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.cat-aviso {
  flex: 1 1 auto;
  min-width: min(100%, 12rem);
  margin: 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.cat-aviso--ok {
  color: var(--color-exito);
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.28);
}

.cat-aviso--error {
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.32);
}

.cat-cel-suave {
  color: var(--color-texto-suave);
}

.cat-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.cat-btn-peligro {
  border-color: rgba(251, 113, 133, 0.45);
  color: var(--color-peligro);
}

.cat-btn-peligro:hover {
  background: rgba(251, 113, 133, 0.1);
  border-color: rgba(251, 113, 133, 0.55);
}

.cat-modal {
  margin: auto;
  padding: 0;
  max-width: calc(100vw - 2rem);
  width: min(24rem, 100%);
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow:
    0 4px 28px rgba(0, 0, 0, 0.32),
    0 0 1px rgba(124, 140, 240, 0.15);
}

.cat-modal::backdrop {
  background: rgba(0, 0, 0, 0.55);
}

.cat-modal-panel {
  padding: 1.25rem clamp(1rem, 3vw, 1.35rem) 1.35rem;
}

.cat-modal-titulo {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.cat-formulario {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.cat-fila {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.cat-textarea {
  resize: vertical;
  min-height: 5rem;
}

.cat-modal-pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-borde);
}
</style>
