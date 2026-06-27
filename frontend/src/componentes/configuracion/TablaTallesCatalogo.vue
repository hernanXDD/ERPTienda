<script setup lang="ts">
import { Check, Layers, Pencil, Plus, Trash2, X } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { esTalleUnicoSistema, etiquetaTipoTalleCatalogo, buscarTalleCatalogoDuplicado } from '../../datos/tallesCatalogo';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useTallesCatalogoStore } from '../../stores/tallesCatalogo';
import type { TalleCatalogo, TipoTalleCatalogo } from '../../tipos/talleCatalogo';

const props = defineProps<{
  puedeEditar: boolean;
}>();

const tallesCatalogoStore = useTallesCatalogoStore();

const cargando = ref(true);
const guardandoId = ref<string | null>(null);
const eliminandoId = ref<string | null>(null);
const creando = ref(false);
const mensajeError = ref('');
const mensajeExito = ref('');

const idEdicionNombre = ref<string | null>(null);
const textoEdicionNombre = ref('');

const nombreNuevo = ref('');
const tipoNuevo = ref<TipoTalleCatalogo>('LETRA');

const filasOrdenadas = computed(() =>
  [...tallesCatalogoStore.talles].sort(
    (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'),
  ),
);

onMounted(async () => {
  mensajeError.value = '';
  try {
    await tallesCatalogoStore.asegurarCargado();
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudieron cargar los talles.');
  } finally {
    cargando.value = false;
  }
});

function limpiarMensajes(): void {
  mensajeError.value = '';
  mensajeExito.value = '';
}

function puedeEliminar(talle: TalleCatalogo): boolean {
  return !esTalleUnicoSistema(talle.codigo);
}

function esSistema(talle: TalleCatalogo): boolean {
  return esTalleUnicoSistema(talle.codigo);
}

function iniciarEdicionNombre(talle: TalleCatalogo): void {
  if (!props.puedeEditar) return;
  idEdicionNombre.value = talle.id;
  textoEdicionNombre.value = talle.nombre;
  limpiarMensajes();
}

function cancelarEdicionNombre(): void {
  idEdicionNombre.value = null;
  textoEdicionNombre.value = '';
}

async function guardarNombre(talle: TalleCatalogo): Promise<void> {
  if (!props.puedeEditar || guardandoId.value) return;
  const nombre = textoEdicionNombre.value.trim();
  if (!nombre) {
    mensajeError.value = 'El nombre no puede quedar vacío.';
    return;
  }
  if (nombre === talle.nombre) {
    cancelarEdicionNombre();
    return;
  }

  const duplicado = buscarTalleCatalogoDuplicado(tallesCatalogoStore.talles, nombre, talle.id);
  if (duplicado) {
    mensajeError.value = `Ya existe el talle «${duplicado.nombre}». No se distinguen mayúsculas y minúsculas.`;
    return;
  }

  limpiarMensajes();
  guardandoId.value = talle.id;

  try {
    const actualizado = await tallesCatalogoStore.actualizar(talle.id, {
      nombre,
      tipo: talle.tipo,
      habilitado: talle.habilitado,
      orden: talle.orden,
    });
    cancelarEdicionNombre();
    mensajeExito.value = `«${actualizado.nombre}» actualizado.`;
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo guardar el talle.');
  } finally {
    guardandoId.value = null;
  }
}

async function actualizarTalle(
  talle: TalleCatalogo,
  cambios: Partial<Pick<TalleCatalogo, 'tipo' | 'habilitado'>>,
): Promise<void> {
  if (!props.puedeEditar || guardandoId.value === talle.id) return;

  const tipo = cambios.tipo ?? talle.tipo;
  const habilitado = cambios.habilitado ?? talle.habilitado;
  if (tipo === talle.tipo && habilitado === talle.habilitado) return;

  limpiarMensajes();
  guardandoId.value = talle.id;

  try {
    const actualizado = await tallesCatalogoStore.actualizar(talle.id, {
      nombre: talle.nombre,
      tipo,
      habilitado,
      orden: talle.orden,
    });
    if (cambios.habilitado !== undefined) {
      mensajeExito.value = `«${actualizado.nombre}» ${habilitado ? 'habilitado' : 'deshabilitado'}.`;
    } else {
      mensajeExito.value = `Tipo de «${actualizado.nombre}» actualizado.`;
    }
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo actualizar el talle.');
  } finally {
    guardandoId.value = null;
  }
}

async function eliminarFila(talle: TalleCatalogo): Promise<void> {
  if (!props.puedeEditar || !puedeEliminar(talle)) return;
  if (!globalThis.confirm(`¿Eliminar el talle «${talle.nombre}»?`)) return;

  limpiarMensajes();
  eliminandoId.value = talle.id;

  try {
    await tallesCatalogoStore.eliminar(talle.id);
    if (idEdicionNombre.value === talle.id) cancelarEdicionNombre();
    mensajeExito.value = 'Talle eliminado.';
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo eliminar el talle.');
  } finally {
    eliminandoId.value = null;
  }
}

async function crearTalle(): Promise<void> {
  if (!props.puedeEditar || creando.value) return;
  const nombre = nombreNuevo.value.trim();
  if (!nombre) {
    mensajeError.value = 'Indicá el talle a agregar (ej. M, 42, 2XL).';
    return;
  }

  const duplicado = buscarTalleCatalogoDuplicado(tallesCatalogoStore.talles, nombre);
  if (duplicado) {
    mensajeError.value = `Ya existe el talle «${duplicado.nombre}». No se distinguen mayúsculas y minúsculas.`;
    return;
  }

  limpiarMensajes();
  creando.value = true;

  try {
    const creado = await tallesCatalogoStore.crear({
      nombre,
      tipo: tipoNuevo.value,
      habilitado: true,
    });
    nombreNuevo.value = '';
    tipoNuevo.value = 'LETRA';
    mensajeExito.value = `«${creado.nombre}» creado.`;
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo crear el talle.');
  } finally {
    creando.value = false;
  }
}
</script>

<template>
  <section class="perm-bloque perm-bloque--ancho" aria-labelledby="cfg-sys-sec-talles">
    <header class="perm-bloque-enc">
      <span class="perm-bloque-ico" aria-hidden="true">
        <Layers :size="16" stroke-width="2" />
      </span>
      <h2 id="cfg-sys-sec-talles" class="perm-bloque-tit">Talles del catálogo</h2>
    </header>

    <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
      <p class="cfg-ficha-ayuda cfg-fp-ayuda">
        Talles disponibles al crear o editar productos. Los deshabilitados no aparecen en el selector,
        pero se conservan en variantes ya cargadas.
      </p>

      <div v-if="mensajeExito || mensajeError" class="cfg-fp-avisos">
        <p v-if="mensajeExito" class="perm-aviso perm-aviso--ok" role="status">{{ mensajeExito }}</p>
        <p v-if="mensajeError" class="perm-aviso perm-aviso--error" role="alert">{{ mensajeError }}</p>
      </div>

      <div v-if="cargando" class="cfg-ficha-carga cfg-fp-carga" role="status">
        <div class="cfg-ficha-carga-pulso" />
        <p>Cargando talles…</p>
      </div>

      <div v-else class="cfg-fp-panel">
        <div class="cfg-fp-scroll" role="region" aria-label="Listado de talles">
          <table class="cfg-fp-tabla">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col" class="cfg-tc-col-tipo">Tipo</th>
                <th scope="col" class="cfg-fp-col-toggle">Habilitado</th>
                <th v-if="puedeEditar" scope="col" class="cfg-fp-col-acc" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="talle in filasOrdenadas"
                :key="talle.id"
                :class="{
                  'cfg-fp-fila--deshabilitada': !talle.habilitado,
                  'cfg-fp-fila--guardando': guardandoId === talle.id,
                }"
              >
                <td class="cfg-fp-cel-nombre">
                  <template v-if="puedeEditar && idEdicionNombre === talle.id">
                    <input
                      v-model="textoEdicionNombre"
                      type="text"
                      class="cfg-ficha-inp cfg-fp-inp-nombre"
                      maxlength="100"
                      :aria-label="`Editar talle ${talle.nombre}`"
                      @keydown.enter.prevent="guardarNombre(talle)"
                      @keydown.escape.prevent="cancelarEdicionNombre"
                    />
                  </template>
                  <template v-else>
                    <span class="cfg-fp-nombre">{{ talle.nombre }}</span>
                    <span v-if="esSistema(talle)" class="cfg-fp-chip cfg-fp-chip--sistema">Sistema</span>
                    <span v-else-if="!talle.habilitado" class="cfg-fp-chip cfg-fp-chip--off">
                      Deshabilitado
                    </span>
                  </template>
                </td>

                <td class="cfg-tc-col-tipo">
                  <template v-if="puedeEditar">
                    <select
                      class="cfg-ficha-inp cfg-tc-sel-tipo"
                      :value="talle.tipo"
                      :disabled="guardandoId === talle.id"
                      :aria-label="`Tipo de ${talle.nombre}`"
                      @change="
                        actualizarTalle(talle, {
                          tipo: ($event.target as HTMLSelectElement).value as TipoTalleCatalogo,
                        })
                      "
                    >
                      <option value="LETRA">Letra</option>
                      <option value="NUMERO">Número</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </template>
                  <span v-else class="cfg-tc-tipo-etiq">{{ etiquetaTipoTalleCatalogo(talle.tipo) }}</span>
                </td>

                <td class="cfg-fp-col-toggle">
                  <template v-if="puedeEditar">
                    <label class="perm-sw cfg-fp-sw" :title="`Habilitar ${talle.nombre}`">
                      <input
                        type="checkbox"
                        class="perm-sw-input"
                        role="switch"
                        :checked="talle.habilitado"
                        :disabled="guardandoId === talle.id"
                        :aria-label="`Habilitar ${talle.nombre}`"
                        @change="
                          actualizarTalle(talle, {
                            habilitado: ($event.target as HTMLInputElement).checked,
                          })
                        "
                      />
                      <span class="perm-sw-ui" aria-hidden="true" />
                    </label>
                  </template>
                  <span
                    v-else
                    class="cfg-fp-valor-bool"
                    :class="{ 'cfg-fp-valor-bool--si': talle.habilitado }"
                  >
                    {{ talle.habilitado ? 'Sí' : 'No' }}
                  </span>
                </td>

                <td v-if="puedeEditar" class="cfg-fp-col-acc">
                  <div class="cfg-fp-acciones">
                    <template v-if="idEdicionNombre === talle.id">
                      <button
                        type="button"
                        class="cfg-fp-btn-icono cfg-fp-btn-icono--ok"
                        title="Guardar"
                        :disabled="guardandoId === talle.id"
                        @click="guardarNombre(talle)"
                      >
                        <Check :size="14" aria-hidden="true" />
                        <span class="pg-sr">Guardar</span>
                      </button>
                      <button
                        type="button"
                        class="cfg-fp-btn-icono"
                        title="Cancelar"
                        :disabled="guardandoId === talle.id"
                        @click="cancelarEdicionNombre"
                      >
                        <X :size="14" aria-hidden="true" />
                        <span class="pg-sr">Cancelar</span>
                      </button>
                    </template>
                    <template v-else>
                      <button
                        type="button"
                        class="cfg-fp-btn-icono"
                        title="Editar nombre"
                        :disabled="guardandoId === talle.id || eliminandoId === talle.id"
                        @click="iniciarEdicionNombre(talle)"
                      >
                        <Pencil :size="14" aria-hidden="true" />
                        <span class="pg-sr">Editar</span>
                      </button>
                      <button
                        v-if="puedeEliminar(talle)"
                        type="button"
                        class="cfg-fp-btn-icono cfg-fp-btn-icono--peligro"
                        title="Eliminar"
                        :disabled="eliminandoId === talle.id || guardandoId === talle.id"
                        @click="eliminarFila(talle)"
                      >
                        <Trash2 :size="14" aria-hidden="true" />
                        <span class="pg-sr">Eliminar</span>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <form v-if="puedeEditar" class="cfg-fp-alta" @submit.prevent="crearTalle">
          <div class="cfg-fp-alta-campo">
            <label class="cfg-ficha-etiq" for="cfg-tc-nombre-nuevo">Nuevo talle</label>
            <input
              id="cfg-tc-nombre-nuevo"
              v-model="nombreNuevo"
              type="text"
              class="cfg-ficha-inp"
              maxlength="32"
              placeholder="Ej. 2XL, 50"
              autocomplete="off"
            />
          </div>
          <div class="cfg-fp-alta-opciones">
            <div class="cfg-tc-alta-tipo">
              <label class="cfg-ficha-etiq" for="cfg-tc-tipo-nuevo">Tipo</label>
              <select id="cfg-tc-tipo-nuevo" v-model="tipoNuevo" class="cfg-ficha-inp cfg-tc-sel-tipo">
                <option value="LETRA">Letra</option>
                <option value="NUMERO">Número</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <button type="submit" class="pg-btn-primario cfg-fp-btn-alta" :disabled="creando">
              <Plus :size="15" aria-hidden="true" />
              {{ creando ? 'Agregando…' : 'Agregar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
