<script setup lang="ts">
import { Check, CreditCard, Pencil, Plus, Trash2, X } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { CODIGO_FORMA_PAGO_CUENTA_CORRIENTE } from '../../datos/formasPago';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useFormasPagoStore } from '../../stores/formasPago';
import type { FormaPago } from '../../tipos/formaPago';

const props = defineProps<{
  puedeEditar: boolean;
}>();

const formasPagoStore = useFormasPagoStore();

const cargando = ref(true);
const guardandoId = ref<string | null>(null);
const eliminandoId = ref<string | null>(null);
const creando = ref(false);
const mensajeError = ref('');
const mensajeExito = ref('');

const idEdicionNombre = ref<string | null>(null);
const textoEdicionNombre = ref('');

const nombreNueva = ref('');
const facturarNueva = ref(true);

const filasOrdenadas = computed(() =>
  [...formasPagoStore.formas].sort(
    (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'),
  ),
);

onMounted(async () => {
  mensajeError.value = '';
  try {
    await formasPagoStore.asegurarCargado();
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudieron cargar las formas de pago.');
  } finally {
    cargando.value = false;
  }
});

function limpiarMensajes(): void {
  mensajeError.value = '';
  mensajeExito.value = '';
}

function puedeEliminar(forma: FormaPago): boolean {
  return forma.codigo !== CODIGO_FORMA_PAGO_CUENTA_CORRIENTE;
}

function esSistema(forma: FormaPago): boolean {
  return forma.codigo === CODIGO_FORMA_PAGO_CUENTA_CORRIENTE;
}

function iniciarEdicionNombre(forma: FormaPago): void {
  if (!props.puedeEditar) return;
  idEdicionNombre.value = forma.id;
  textoEdicionNombre.value = forma.nombre;
  limpiarMensajes();
}

function cancelarEdicionNombre(): void {
  idEdicionNombre.value = null;
  textoEdicionNombre.value = '';
}

async function guardarNombre(forma: FormaPago): Promise<void> {
  if (!props.puedeEditar || guardandoId.value) return;
  const nombre = textoEdicionNombre.value.trim();
  if (!nombre) {
    mensajeError.value = 'El nombre no puede quedar vacío.';
    return;
  }
  if (nombre === forma.nombre) {
    cancelarEdicionNombre();
    return;
  }

  limpiarMensajes();
  guardandoId.value = forma.id;

  try {
    const actualizada = await formasPagoStore.actualizar(forma.id, {
      nombre,
      facturar: forma.facturar,
      habilitado: forma.habilitado,
      orden: forma.orden,
    });
    cancelarEdicionNombre();
    mensajeExito.value = `«${actualizada.nombre}» actualizada.`;
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo guardar el nombre.');
  } finally {
    guardandoId.value = null;
  }
}

async function alternarCampo(
  forma: FormaPago,
  campo: 'facturar' | 'habilitado',
  valor: boolean,
): Promise<void> {
  if (!props.puedeEditar || guardandoId.value === forma.id) return;
  if (forma[campo] === valor) return;

  limpiarMensajes();
  guardandoId.value = forma.id;

  try {
    const actualizada = await formasPagoStore.actualizar(forma.id, {
      nombre: forma.nombre,
      facturar: campo === 'facturar' ? valor : forma.facturar,
      habilitado: campo === 'habilitado' ? valor : forma.habilitado,
      orden: forma.orden,
    });
    const etiqueta = campo === 'habilitado' ? (valor ? 'habilitada' : 'deshabilitada') : '';
    mensajeExito.value =
      campo === 'habilitado'
        ? `«${actualizada.nombre}» ${etiqueta}.`
        : `Facturación de «${actualizada.nombre}» actualizada.`;
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo actualizar la forma de pago.');
  } finally {
    guardandoId.value = null;
  }
}

async function eliminarFila(forma: FormaPago): Promise<void> {
  if (!props.puedeEditar || !puedeEliminar(forma)) return;
  if (!globalThis.confirm(`¿Eliminar la forma de pago «${forma.nombre}»?`)) return;

  limpiarMensajes();
  eliminandoId.value = forma.id;

  try {
    await formasPagoStore.eliminar(forma.id);
    if (idEdicionNombre.value === forma.id) cancelarEdicionNombre();
    mensajeExito.value = 'Forma de pago eliminada.';
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo eliminar la forma de pago.');
  } finally {
    eliminandoId.value = null;
  }
}

async function crearFormaPago(): Promise<void> {
  if (!props.puedeEditar || creando.value) return;
  const nombre = nombreNueva.value.trim();
  if (!nombre) {
    mensajeError.value = 'Indicá un nombre para la nueva forma de pago.';
    return;
  }

  limpiarMensajes();
  creando.value = true;

  try {
    const creada = await formasPagoStore.crear({
      nombre,
      facturar: facturarNueva.value,
      habilitado: true,
    });
    nombreNueva.value = '';
    facturarNueva.value = true;
    mensajeExito.value = `«${creada.nombre}» creada.`;
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo crear la forma de pago.');
  } finally {
    creando.value = false;
  }
}
</script>

<template>
  <section class="perm-bloque perm-bloque--ancho" aria-labelledby="cfg-sys-sec-formas-pago">
    <header class="perm-bloque-enc">
      <span class="perm-bloque-ico" aria-hidden="true">
        <CreditCard :size="16" stroke-width="2" />
      </span>
      <h2 id="cfg-sys-sec-formas-pago" class="perm-bloque-tit">Formas de pago</h2>
    </header>

    <div class="perm-bloque-cuerpo cfg-ficha-grid cfg-ficha-grid--vertical">
      <p class="cfg-ficha-ayuda cfg-fp-ayuda">
        Formas de cobro en ventas. Las que no facturan quedan fuera del reporte de facturación
        (por ejemplo, cuenta corriente).
      </p>

      <div v-if="mensajeExito || mensajeError" class="cfg-fp-avisos">
        <p v-if="mensajeExito" class="perm-aviso perm-aviso--ok" role="status">{{ mensajeExito }}</p>
        <p v-if="mensajeError" class="perm-aviso perm-aviso--error" role="alert">{{ mensajeError }}</p>
      </div>

      <div v-if="cargando" class="cfg-ficha-carga cfg-fp-carga" role="status">
        <div class="cfg-ficha-carga-pulso" />
        <p>Cargando formas de pago…</p>
      </div>

      <div v-else class="cfg-fp-panel">
        <div class="cfg-fp-scroll" role="region" aria-label="Listado de formas de pago">
          <table class="cfg-fp-tabla">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col" class="cfg-fp-col-toggle">Facturar</th>
                <th scope="col" class="cfg-fp-col-toggle">Habilitada</th>
                <th v-if="puedeEditar" scope="col" class="cfg-fp-col-acc" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="forma in filasOrdenadas"
                :key="forma.id"
                :class="{
                  'cfg-fp-fila--deshabilitada': !forma.habilitado,
                  'cfg-fp-fila--guardando': guardandoId === forma.id,
                }"
              >
                <td class="cfg-fp-cel-nombre">
                  <template v-if="puedeEditar && idEdicionNombre === forma.id">
                    <input
                      v-model="textoEdicionNombre"
                      type="text"
                      class="cfg-ficha-inp cfg-fp-inp-nombre"
                      maxlength="100"
                      :aria-label="`Editar nombre de ${forma.nombre}`"
                      @keydown.enter.prevent="guardarNombre(forma)"
                      @keydown.escape.prevent="cancelarEdicionNombre"
                    />
                  </template>
                  <template v-else>
                    <span class="cfg-fp-nombre">{{ forma.nombre }}</span>
                    <span v-if="esSistema(forma)" class="cfg-fp-chip cfg-fp-chip--sistema">Sistema</span>
                    <span v-else-if="!forma.habilitado" class="cfg-fp-chip cfg-fp-chip--off">
                      Deshabilitada
                    </span>
                  </template>
                </td>

                <td class="cfg-fp-col-toggle">
                  <template v-if="puedeEditar">
                    <label class="perm-sw cfg-fp-sw" :title="`Facturar ventas con ${forma.nombre}`">
                      <input
                        type="checkbox"
                        class="perm-sw-input"
                        role="switch"
                        :checked="forma.facturar"
                        :disabled="guardandoId === forma.id"
                        :aria-label="`Facturar ${forma.nombre}`"
                        @change="
                          alternarCampo(
                            forma,
                            'facturar',
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      />
                      <span class="perm-sw-ui" aria-hidden="true" />
                    </label>
                  </template>
                  <span v-else class="cfg-fp-valor-bool" :class="{ 'cfg-fp-valor-bool--si': forma.facturar }">
                    {{ forma.facturar ? 'Sí' : 'No' }}
                  </span>
                </td>

                <td class="cfg-fp-col-toggle">
                  <template v-if="puedeEditar">
                    <label class="perm-sw cfg-fp-sw" :title="`Habilitar ${forma.nombre} en ventas`">
                      <input
                        type="checkbox"
                        class="perm-sw-input"
                        role="switch"
                        :checked="forma.habilitado"
                        :disabled="guardandoId === forma.id"
                        :aria-label="`Habilitar ${forma.nombre}`"
                        @change="
                          alternarCampo(
                            forma,
                            'habilitado',
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      />
                      <span class="perm-sw-ui" aria-hidden="true" />
                    </label>
                  </template>
                  <span
                    v-else
                    class="cfg-fp-valor-bool"
                    :class="{ 'cfg-fp-valor-bool--si': forma.habilitado }"
                  >
                    {{ forma.habilitado ? 'Sí' : 'No' }}
                  </span>
                </td>

                <td v-if="puedeEditar" class="cfg-fp-col-acc">
                  <div class="cfg-fp-acciones">
                    <template v-if="idEdicionNombre === forma.id">
                      <button
                        type="button"
                        class="cfg-fp-btn-icono cfg-fp-btn-icono--ok"
                        title="Guardar nombre"
                        :disabled="guardandoId === forma.id"
                        @click="guardarNombre(forma)"
                      >
                        <Check :size="14" aria-hidden="true" />
                        <span class="pg-sr">Guardar</span>
                      </button>
                      <button
                        type="button"
                        class="cfg-fp-btn-icono"
                        title="Cancelar"
                        :disabled="guardandoId === forma.id"
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
                        :disabled="guardandoId === forma.id || eliminandoId === forma.id"
                        @click="iniciarEdicionNombre(forma)"
                      >
                        <Pencil :size="14" aria-hidden="true" />
                        <span class="pg-sr">Editar</span>
                      </button>
                      <button
                        v-if="puedeEliminar(forma)"
                        type="button"
                        class="cfg-fp-btn-icono cfg-fp-btn-icono--peligro"
                        title="Eliminar"
                        :disabled="eliminandoId === forma.id || guardandoId === forma.id"
                        @click="eliminarFila(forma)"
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

        <form v-if="puedeEditar" class="cfg-fp-alta" @submit.prevent="crearFormaPago">
          <div class="cfg-fp-alta-campo">
            <label class="cfg-ficha-etiq" for="cfg-fp-nombre-nueva">Nueva forma de pago</label>
            <input
              id="cfg-fp-nombre-nueva"
              v-model="nombreNueva"
              type="text"
              class="cfg-ficha-inp"
              maxlength="100"
              placeholder="Ej. Mercado Pago"
              autocomplete="off"
            />
          </div>
          <div class="cfg-fp-alta-opciones">
            <label class="cfg-fp-alta-check">
              <input v-model="facturarNueva" type="checkbox" class="cfg-fp-check-nativa" />
              <span>Facturar en reporte</span>
            </label>
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
