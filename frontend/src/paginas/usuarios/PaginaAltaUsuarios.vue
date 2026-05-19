<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { etiquetaRolUsuario } from '../../datos/etiquetasRolUsuario';
import type { RolUsuario } from '../../tipos/sesion';
import { useSesionStore } from '../../stores/sesion';
import {
  type DatosActualizacionUsuarioGestion,
  type DatosAltaUsuarioGestion,
  useGestionUsuariosStore,
} from '../../stores/gestionUsuarios';
import type { UsuarioGestion } from '../../tipos/usuarioGestion';

const gestionStore = useGestionUsuariosStore();
const sesionStore = useSesionStore();
const { usuarios } = storeToRefs(gestionStore);

const refDialogoUsuario = useTemplateRef<HTMLDialogElement>('refDialogoUsuario');

const modoFormulario = ref<'alta' | 'edicion'>('alta');
const usuarioEnEdicion = ref<UsuarioGestion | null>(null);

const borradorNombre = ref('');
const borradorApellido = ref('');
const borradorNombreUsuario = ref('');
const borradorContrasena = ref('');
const borradorRol = ref<RolUsuario>('EMPLEADO');
const borradorHabilitado = ref(true);
const mensajeFormulario = ref('');
const mensajeListaGlobal = ref('');
const busquedaUsuario = ref('');

const usuarioOperadorSesion = computed(() => {
  const id = sesionStore.usuario?.id;
  if (!id) return undefined;
  return gestionStore.obtenerPorId(id);
});

const permisosOperador = computed(() => usuarioOperadorSesion.value?.permisos);

const puedeEditarFichas = computed(
  () => permisosOperador.value?.puedeGestionarFichasDeUsuario ?? false
);
const puedeInhabilitar = computed(() => permisosOperador.value?.puedeInhabilitarUsuario ?? false);

/** Solo propia cuenta salvo Administrador o Dueño (pueden blanquear cuentas ajenas). */
function operadorEsAdministradorODueño(): boolean {
  const rol = usuarioOperadorSesion.value?.rol;
  return rol === 'ADMIN' || rol === 'DUEÑO';
}

function puedeBlanquearContraseniaDe(usuarioGestor: UsuarioGestion): boolean {
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return false;
  if (operadorEsAdministradorODueño()) return true;
  return (
    (permisosOperador.value?.puedeBlanquearContrasenaUsuario ?? false) &&
    usuarioGestor.id === idSesionUsuario.value
  );
}

function tituloBotonBlanquear(usuarioGestor: UsuarioGestion): string | undefined {
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return undefined;
  if (puedeBlanquearContraseniaDe(usuarioGestor)) return 'Blanquear contraseña';
  if (!(permisosOperador.value?.puedeBlanquearContrasenaUsuario ?? false)) {
    return 'Sin permiso para blanquear contraseña';
  }
  return 'Solo podés blanquear la contraseña de tu propia cuenta';
}

const puedeEliminarUsuario = computed(() => permisosOperador.value?.puedeEliminarUsuario ?? false);

const idSesionUsuario = computed(() => sesionStore.usuario?.id ?? '');

/** Dueño no ve ni opera sobre cuentas Administrador (política de negocio demo). */
const sesionEsDueño = computed(() => sesionStore.usuario?.rol === 'DUEÑO');

const operadorPuedeAsignarRolAdministrador = computed(() => sesionStore.usuario?.rol !== 'DUEÑO');

function esAdministradorOcultoParaSesionActual(usuarioGestor: UsuarioGestion): boolean {
  return sesionEsDueño.value && usuarioGestor.rol === 'ADMIN';
}

function claseVisualRolUsuario(rol: RolUsuario): string {
  switch (rol) {
    case 'ADMIN':
      return 'ua-rol-pill ua-rol-pill--admin';
    case 'DUEÑO':
      return 'ua-rol-pill ua-rol-pill--dueno';
    default:
      return 'ua-rol-pill ua-rol-pill--empleado';
  }
}

const usuariosOrdenados = computed(() =>
  [...usuarios.value]
    .filter((u) => !esAdministradorOcultoParaSesionActual(u))
    .sort((a, b) => {
      const porApellido = a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' });
      if (porApellido !== 0) return porApellido;
      const porNombre = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      if (porNombre !== 0) return porNombre;
      return a.nombreUsuario.localeCompare(b.nombreUsuario, 'es', { sensitivity: 'base' });
    }),
);

const usuariosFiltradosLista = computed(() => {
  const q = busquedaUsuario.value.trim().toLowerCase();
  const base = usuariosOrdenados.value;
  if (!q) return base;
  return base.filter(
    (u) =>
      u.nombre.toLowerCase().includes(q) ||
      u.apellido.toLowerCase().includes(q) ||
      u.nombreUsuario.toLowerCase().includes(q) ||
      etiquetaRolUsuario(u.rol).toLowerCase().includes(q)
  );
});

function mostrarRetroalimentacionLista(texto: string) {
  mensajeListaGlobal.value = texto;
  globalThis.setTimeout(() => {
    if (mensajeListaGlobal.value === texto) mensajeListaGlobal.value = '';
  }, 8000);
}

function abrirAltaUsuario() {
  if (!puedeEditarFichas.value) return;
  modoFormulario.value = 'alta';
  usuarioEnEdicion.value = null;
  borradorNombre.value = '';
  borradorApellido.value = '';
  borradorNombreUsuario.value = '';
  borradorContrasena.value = '';
  borradorRol.value = 'EMPLEADO';
  borradorHabilitado.value = true;
  mensajeFormulario.value = '';
  nextTick(() => refDialogoUsuario.value?.showModal());
}

function abrirEditarUsuario(usuarioGestor: UsuarioGestion) {
  if (!puedeEditarFichas.value) return;
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return;
  modoFormulario.value = 'edicion';
  usuarioEnEdicion.value = usuarioGestor;
  borradorNombre.value = usuarioGestor.nombre;
  borradorApellido.value = usuarioGestor.apellido;
  borradorNombreUsuario.value = usuarioGestor.nombreUsuario;
  borradorContrasena.value = '';
  borradorRol.value = usuarioGestor.rol;
  borradorHabilitado.value = usuarioGestor.habilitado;
  mensajeFormulario.value = '';
  nextTick(() => refDialogoUsuario.value?.showModal());
}

function cerrarDialogo() {
  refDialogoUsuario.value?.close();
  usuarioEnEdicion.value = null;
  mensajeFormulario.value = '';
}

function guardarFormulario() {
  mensajeFormulario.value = '';

  if (sesionEsDueño.value && borradorRol.value === 'ADMIN') {
    mensajeFormulario.value = 'No podés crear ni asignar el rol Administrador con tu cuenta de Dueño.';
    return;
  }

  if (
    modoFormulario.value === 'edicion' &&
    usuarioEnEdicion.value &&
    esAdministradorOcultoParaSesionActual(usuarioEnEdicion.value)
  ) {
    mensajeFormulario.value = 'No tenés permiso para modificar esa cuenta.';
    return;
  }

  if (modoFormulario.value === 'alta') {
    const datosAlta: DatosAltaUsuarioGestion = {
      nombre: borradorNombre.value,
      apellido: borradorApellido.value,
      nombreUsuario: borradorNombreUsuario.value,
      contrasenaPlano: borradorContrasena.value,
      rol: borradorRol.value,
      habilitado: borradorHabilitado.value,
    };
    const resultadoAlta = gestionStore.agregarUsuario(datosAlta);
    if (resultadoAlta !== true) {
      mensajeFormulario.value = resultadoAlta;
      return;
    }
    cerrarDialogo();
    mostrarRetroalimentacionLista('Usuario creado correctamente.');
    return;
  }

  const idUsuario = usuarioEnEdicion.value?.id;
  if (!idUsuario) return;

  const datosEdicion: DatosActualizacionUsuarioGestion = {
    nombre: borradorNombre.value,
    apellido: borradorApellido.value,
    nombreUsuario: borradorNombreUsuario.value,
    contrasenaPlano:
      borradorContrasena.value.trim().length > 0 ? borradorContrasena.value : null,
    rol: borradorRol.value,
    habilitado: borradorHabilitado.value,
  };

  const resultadoEdicion = gestionStore.actualizarUsuario(idUsuario, datosEdicion);
  if (resultadoEdicion !== true) {
    mensajeFormulario.value = resultadoEdicion;
    return;
  }
  cerrarDialogo();
  mostrarRetroalimentacionLista('Ficha guardada.');
}

function onToggleHabilitadoSesion(usuarioGestor: UsuarioGestion, habilitado: boolean) {
  if (!puedeInhabilitar.value) return;
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return;
  if (usuarioGestor.id === idSesionUsuario.value) {
    mostrarRetroalimentacionLista('No podés cambiar tu propio estado de sesión desde la tarjeta.');
    return;
  }
  if (usuarioGestor.habilitado === habilitado) return;

  const res = gestionStore.establecerHabilitacionUsuario(usuarioGestor.id, habilitado);
  if (res !== true) {
    mostrarRetroalimentacionLista(res);
    return;
  }
  mostrarRetroalimentacionLista(
    habilitado
      ? `Usuario "${usuarioGestor.nombreUsuario}" habilitado.`
      : `Usuario "${usuarioGestor.nombreUsuario}" inhabilitado.`
  );
}

function accionBlanquearCredencial(usuarioGestor: UsuarioGestion) {
  if (!puedeBlanquearContraseniaDe(usuarioGestor)) return;
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return;
  const texto =
    'Se bloqueará el acceso con la contraseña actual. El usuario no podrá entrar hasta que alguien con permiso de ficha cargue una contraseña nueva en “Editar”.\n\n¿Continuar?';
  if (!window.confirm(texto)) return;

  const res = gestionStore.blanquearContraseniaUsuario(usuarioGestor.id);
  if (res !== true) {
    mostrarRetroalimentacionLista(res);
    return;
  }
  mostrarRetroalimentacionLista(
    `Contraseña blanqueada para "${usuarioGestor.nombreUsuario}". Asigná una nueva desde Editar cuando corresponda.`
  );
}

function accionEliminarUsuario(usuarioGestor: UsuarioGestion) {
  if (!puedeEliminarUsuario.value) return;
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return;
  if (usuarioGestor.id === idSesionUsuario.value) {
    mostrarRetroalimentacionLista('No podés eliminar tu propia cuenta mientras iniciaste sesión con ella.');
    return;
  }
  if (
    !window.confirm(
      `¿Eliminar definitivamente al usuario "${usuarioGestor.nombreUsuario}" (${usuarioGestor.nombre} ${usuarioGestor.apellido})? Esta acción no se puede deshacer en el modo demo.`
    )
  ) {
    return;
  }

  const res = gestionStore.eliminarUsuario(usuarioGestor.id);
  if (res !== true) {
    mostrarRetroalimentacionLista(res);
    return;
  }
  mostrarRetroalimentacionLista('Usuario eliminado.');
}
</script>

<template>
  <section class="ua" aria-labelledby="titulo-alta-usuarios">
    <header class="ua-cab">
      <p class="ua-rubro">Usuarios</p>
      <h1 id="titulo-alta-usuarios" class="ua-tit">Alta y fichas de usuario</h1>
      <p class="ua-sub">
        Entorno demo: creación y mantenimiento de cuentas locales. Las acciones sensibles (fichas, inhabilitar, blanquear
        o eliminar) dependen de lo definido en
        <strong>Permisos usuario</strong>
        ; por defecto las gestionan Administrador y Dueño.
      </p>
    </header>

    <p v-if="sesionEsDueño" class="ua-aviso-politica-dueno">
      Con perfil <strong>Dueño</strong>, las cuentas con rol <strong>Administrador</strong> no se listan aquí: las gestiona solo quien inicia sesión como administrador.
    </p>

    <p v-if="mensajeListaGlobal" class="ua-retro ua-retro--exito" role="status">{{ mensajeListaGlobal }}</p>
    <p v-if="!puedeEditarFichas" class="ua-aviso-sin_permiso">
      No tenés permiso para alta o edición completa de fichas. Si corresponde, pedí en
      <strong>Permisos usuario</strong>
      las marcas necesarias para tu cuenta.
    </p>

    <div class="ua-barra">
      <div class="ua-barra-fila">
        <div class="ua-busq">
          <label class="ua-etq" for="busq-usuario-alta">Buscar</label>
          <input
            id="busq-usuario-alta"
            v-model="busquedaUsuario"
            type="search"
            class="ua-inp"
            placeholder="Nombre, apellido, usuario de login o rol…"
            autocomplete="off"
          />
        </div>
        <div class="ua-acciones">
          <span class="ua-contador" aria-live="polite">
            {{ usuariosFiltradosLista.length }} cuenta{{ usuariosFiltradosLista.length === 1 ? '' : 's' }}
          </span>
          <button
            v-if="puedeEditarFichas"
            type="button"
            class="ua-btn-pri"
            @click="abrirAltaUsuario"
          >
            Nuevo usuario
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="usuariosFiltradosLista.length"
      class="ua-grid-viewport"
      role="region"
      aria-label="Usuarios del sistema"
    >
      <div class="ua-grid-wrap">
        <article
          v-for="uFil in usuariosFiltradosLista"
          :key="uFil.id"
          class="ua-card"
          :class="{ 'ua-card--inhabil': !uFil.habilitado }"
        >
          <div class="ua-card-afilado" aria-hidden="true" />
          <div class="ua-card-cuerpo ua-card-cuerpo--resumida">
            <header class="ua-card-cab">
              <h2 class="ua-card-nom">{{ uFil.apellido }}, {{ uFil.nombre }}</h2>
              <span v-if="!uFil.habilitado" class="ua-badge">Inhabilitado</span>
            </header>
            <p class="ua-card-login ua-mono" :title="uFil.nombreUsuario">{{ uFil.nombreUsuario }}</p>
            <div class="ua-card-fila-rol">
              <span :class="claseVisualRolUsuario(uFil.rol)">{{ etiquetaRolUsuario(uFil.rol) }}</span>
            </div>
            <div v-if="uFil.contrasenaEstaBlanqueada" class="ua-card-fila-chip">
              <span class="ua-chip ua-chip--adv" title="Credencial pendiente por asignar">
                Credencial pendiente
              </span>
            </div>

            <footer class="ua-card-pie">
              <div class="ua-card-sw">
                <span class="ua-card-sw-lbl">Sesión</span>
                <label
                  class="ua-sw ua-sw--compacto"
                  :title="
                    !puedeInhabilitar
                      ? 'Sin permiso para habilitar o inhabilitar sesión'
                      : uFil.id === idSesionUsuario
                        ? 'No podés cambiar tu propio estado de sesión desde la tarjeta'
                        : undefined
                  "
                >
                  <input
                    type="checkbox"
                    class="ua-sw-input"
                    role="switch"
                    :disabled="!puedeInhabilitar || uFil.id === idSesionUsuario"
                    :aria-label="`Cuenta ${uFil.habilitado ? 'habilitada' : 'inhabilitada'} para iniciar sesión: ${uFil.nombreUsuario}`"
                    :checked="uFil.habilitado"
                    @change="
                      onToggleHabilitadoSesion(uFil, ($event.target as HTMLInputElement).checked)
                    "
                  />
                  <span class="ua-sw-ui" aria-hidden="true" />
                </label>
              </div>
              <div class="ua-card-acciones">
                <button
                  type="button"
                  class="ua-btn-ed"
                  :disabled="!puedeEditarFichas"
                  :title="!puedeEditarFichas ? 'Sin permiso de fichas de usuario' : undefined"
                  @click="abrirEditarUsuario(uFil)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="ua-btn-detalle"
                  :disabled="!puedeBlanquearContraseniaDe(uFil)"
                  :title="tituloBotonBlanquear(uFil)"
                  @click="accionBlanquearCredencial(uFil)"
                >
                  Blanquear
                </button>
                <button
                  type="button"
                  class="ua-btn-detalle ua-btn-detalle--pel"
                  :disabled="!puedeEliminarUsuario || uFil.id === idSesionUsuario"
                  :title="
                    uFil.id === idSesionUsuario
                      ? 'No podés borrar tu cuenta activa desde acá'
                      : !puedeEliminarUsuario
                        ? 'Sin permiso para eliminar'
                        : 'Eliminar ficha definitivamente'
                  "
                  @click="accionEliminarUsuario(uFil)"
                >
                  Eliminar
                </button>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
    <p v-else-if="usuariosOrdenados.length" class="ua-vacio-msg" role="status">
      No hay usuarios que coincidan con la búsqueda.
    </p>
    <div v-else class="ua-vacio-msg" role="status">
      <span class="ua-vacio-msg-tit">No hay usuarios</span>
      <span class="ua-vacio-msg-det">
        Creá la primera cuenta con «Nuevo usuario» si tenés permiso de fichas.
      </span>
    </div>

    <Teleport to="body">
      <dialog ref="refDialogoUsuario" class="ua-modal" @cancel.prevent="cerrarDialogo">
      <form class="ua-modal-panel" @submit.prevent="guardarFormulario">
        <div class="ua-modal-cab">
          <div>
            <p class="ua-modal-rubro">{{ modoFormulario === 'alta' ? 'Alta' : 'Edición' }}</p>
            <h2 id="titulo-modal-usuario" class="ua-modal-tit">
              {{ modoFormulario === 'alta' ? 'Nuevo usuario' : 'Editar usuario' }}
            </h2>
          </div>
          <button type="button" class="ua-modal-x" aria-label="Cerrar" @click="cerrarDialogo">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <fieldset class="ua-fs">
          <legend class="ua-legend">Datos personales</legend>
          <div class="ua-grid-par">
            <div class="ua-campo">
              <label class="ua-etq" for="dlg-persona-nombre">Nombre</label>
              <input
                id="dlg-persona-nombre"
                v-model="borradorNombre"
                type="text"
                required
                class="ua-inp"
                maxlength="64"
                autocomplete="given-name"
              />
            </div>
            <div class="ua-campo">
              <label class="ua-etq" for="dlg-persona-apellido">Apellido</label>
              <input
                id="dlg-persona-apellido"
                v-model="borradorApellido"
                type="text"
                required
                class="ua-inp"
                maxlength="64"
                autocomplete="family-name"
              />
            </div>
          </div>
        </fieldset>

        <fieldset class="ua-fs ua-fs--sep">
          <legend class="ua-legend">Credenciales de acceso</legend>
          <div class="ua-campo">
            <label class="ua-etq" for="dlg-usuario-nombre">Nombre de usuario (login)</label>
            <input
              id="dlg-usuario-nombre"
              v-model="borradorNombreUsuario"
              type="text"
              required
              class="ua-inp ua-inp--mono"
              maxlength="48"
              autocomplete="username"
              spellcheck="false"
            />
          </div>
          <div class="ua-campo">
            <label class="ua-etq" for="dlg-usuario-pass">
              {{ modoFormulario === 'edicion' ? 'Nueva contraseña (opcional)' : 'Contraseña inicial' }}
            </label>
            <input
              id="dlg-usuario-pass"
              v-model="borradorContrasena"
              type="password"
              :required="modoFormulario === 'alta'"
              class="ua-inp"
              maxlength="72"
              autocomplete="new-password"
              :placeholder="
                modoFormulario === 'edicion'
                  ? usuarioEnEdicion?.contrasenaEstaBlanqueada
                    ? 'Debés cargar nueva contraseña para levantar el bloqueo…'
                    : 'Dejar vacío para no cambiar…'
                  : ''
              "
            />
            <p v-if="modoFormulario === 'edicion' && usuarioEnEdicion?.contrasenaEstaBlanqueada" class="ua-ayuda-mini">
              La credencial fue blanqueada: cargá obligatoriamente una contraseña nueva al guardar o el usuario sigue sin
              poder ingresar.
            </p>
          </div>
        </fieldset>

        <fieldset class="ua-fs ua-fs--sep">
          <legend class="ua-legend">Rol y estado</legend>
          <div class="ua-campo">
            <label class="ua-etq" for="dlg-usuario-rol">Rol en el sistema</label>
            <select id="dlg-usuario-rol" v-model="borradorRol" class="ua-inp ua-select">
              <option v-if="operadorPuedeAsignarRolAdministrador" value="ADMIN">Administrador</option>
              <option value="DUEÑO">Dueño</option>
              <option value="EMPLEADO">Empleado</option>
            </select>
          </div>
          <label class="ua-chk" :class="{ 'ua-chk--deshab': !puedeInhabilitar }">
            <input v-model="borradorHabilitado" type="checkbox" :disabled="!puedeInhabilitar" />
            <span>Cuenta habilitada para iniciar sesión (con contraseña vigente)</span>
          </label>
          <p v-if="!puedeInhabilitar" class="ua-ayuda-mini">
            No podés cambiar el estado desde el formulario. Pedí permiso para «inhabilitar usuario» si lo necesitás.
          </p>
        </fieldset>

        <p v-if="mensajeFormulario" class="ua-error" role="alert">{{ mensajeFormulario }}</p>

        <footer class="ua-modal-pie">
          <button type="button" class="ua-btn-sec" @click="cerrarDialogo">Cancelar</button>
          <button
            type="submit"
            class="ua-btn-pri ua-btn-pri--modal"
            :disabled="
              modoFormulario === 'edicion' &&
              usuarioEnEdicion?.contrasenaEstaBlanqueada &&
              borradorContrasena.trim().length === 0
            "
          >
            Guardar
          </button>
        </footer>
      </form>
    </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.ua {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 72rem;
  margin: 0 auto;
  --ua-grid-gap: 0.6rem;
  --ua-grid-col: 3;
  --ua-grid-filas-visibles: 3;
  --ua-altura-card-fila: 10.35rem;
  --ua-grid-viewpad-v: 1rem;
  --ua-panel-h: min(
    calc(
      var(--ua-grid-filas-visibles) * var(--ua-altura-card-fila) +
        (var(--ua-grid-filas-visibles) - 1) * var(--ua-grid-gap) +
        var(--ua-grid-viewpad-v)
    ),
    82vh
  );
}

.ua-cab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.ua-rubro {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ua-tit {
  margin: 0.35rem 0 0;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.ua-sub {
  margin: 0.55rem 0 0;
  max-width: 46rem;
  font-size: 0.84rem;
  line-height: 1.55;
  color: var(--color-texto-apagado);
}

.ua-retro {
  margin: 0;
  padding: 0.65rem 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  font-size: 0.84rem;
  color: var(--color-texto-suave);
  box-shadow: var(--sombra-suave);
}

.ua-retro--exito {
  border-color: rgba(74, 222, 128, 0.35);
  background: rgba(74, 222, 128, 0.08);
  color: var(--color-exito);
}

.ua-aviso-sin_permiso {
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px dashed var(--color-borde);
  font-size: 0.84rem;
  color: var(--color-texto-apagado);
  line-height: 1.45;
  background: rgba(124, 140, 240, 0.04);
}

.ua-aviso-politica-dueno {
  margin: 0;
  padding: 0.62rem 0.9rem;
  border-radius: var(--radio-control);
  border: 1px solid rgba(234, 179, 8, 0.35);
  background: rgba(234, 179, 8, 0.08);
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--color-texto-suave);
}

.ua-aviso-politica-dueno strong {
  color: var(--color-texto);
  font-weight: 600;
}

.ua-barra {
  padding: 1rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.ua-barra-fila {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

@media (min-width: 720px) {
  .ua-barra-fila {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .ua-busq {
    flex: 1;
    max-width: none;
    min-width: 14rem;
  }

  .ua-acciones {
    margin-left: auto;
  }
}

.ua-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.ua-busq {
  max-width: 24rem;
}

.ua-busq .ua-etq {
  display: block;
  margin-bottom: 0.3rem;
}

.ua-contador {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  border: 1px solid var(--color-borde);
}

.ua-grid-viewport {
  height: var(--ua-panel-h);
  max-height: var(--ua-panel-h);
  overflow: auto;
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  box-sizing: border-box;
}

.ua-grid-wrap {
  display: grid;
  grid-template-columns: repeat(var(--ua-grid-col), minmax(0, 1fr));
  grid-auto-rows: minmax(var(--ua-altura-card-fila), auto);
  gap: var(--ua-grid-gap);
  align-items: stretch;
}

@media (max-width: 719px) {
  .ua {
    --ua-grid-col: 1;
    --ua-altura-card-fila: 10rem;
    --ua-panel-h: min(
      calc(
        var(--ua-grid-filas-visibles) * var(--ua-altura-card-fila) +
          (var(--ua-grid-filas-visibles) - 1) * var(--ua-grid-gap) +
          var(--ua-grid-viewpad-v)
      ),
      72vh
    );
  }
}

@media (min-width: 720px) and (max-width: 1023px) {
  .ua {
    --ua-grid-col: 2;
  }
}

.ua-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: var(--ua-altura-card-fila);
  align-self: stretch;
  overflow-x: clip;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: linear-gradient(
    165deg,
    rgba(19, 26, 40, 0.98) 0%,
    rgba(26, 33, 50, 0.92) 38%,
    rgba(26, 33, 50, 0.88) 100%
  );
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.07),
    0 12px 28px rgba(0, 0, 0, 0.32);
  transition:
    border-color 0.18s ease,
    box-shadow 0.2s ease,
    transform 0.18s ease;
}

@media (hover: hover) and (pointer: fine) {
  .ua-card:hover {
    border-color: rgba(124, 140, 240, 0.35);
    box-shadow:
      0 0 0 1px rgba(124, 140, 240, 0.12),
      0 16px 40px rgba(0, 0, 0, 0.38);
    transform: translateY(-1px);
  }
}

.ua-card--inhabil {
  opacity: 0.82;
  border-style: dashed;
  filter: saturate(0.92);
}

.ua-card--inhabil .ua-card-afilado {
  opacity: 0.45;
}

.ua-card-afilado {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 140, 240, 0.55),
    rgba(154, 124, 240, 0.45),
    transparent
  );
}

.ua-card-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  flex: 1 1 auto;
  padding: 0.65rem 0.82rem 0.55rem;
  overflow: visible;
}

.ua-card-cuerpo--resumida {
  gap: 0.42rem;
  padding: 0.58rem 0.72rem 0.52rem;
}

.ua-card-login {
  margin: 0;
  flex-shrink: 0;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--color-texto-apagado);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ua-card-fila-rol {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.ua-card-fila-chip {
  flex-shrink: 0;
}

.ua-card-cab {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.45rem;
  padding-bottom: 0.05rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.55);
}

.ua-card-nom {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -0.025em;
  color: var(--color-texto);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.ua-badge {
  flex-shrink: 0;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.2rem 0.42rem;
  border-radius: 6px;
  background: rgba(251, 113, 133, 0.16);
  border: 1px solid rgba(251, 113, 133, 0.35);
  color: var(--color-peligro);
}

.ua-card-pie {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem 0.65rem;
  margin-top: auto;
  padding-top: 0.48rem;
  border-top: 1px solid rgba(42, 58, 84, 0.55);
}

@media (max-width: 420px) {
  .ua-card-pie {
    flex-direction: column;
    align-items: stretch;
  }

  .ua-card-acciones {
    width: 100%;
    margin-left: 0;
    justify-content: stretch;
  }

  .ua-card-acciones .ua-btn-detalle,
  .ua-card-acciones .ua-btn-ed {
    flex: 1;
    justify-content: center;
  }
}

.ua-card-sw {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
}

.ua-card-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-left: auto;
  justify-content: flex-end;
}

.ua-card-sw-lbl {
  font-size: 0.6275rem;
  font-weight: 600;
  color: var(--color-texto-apagado);
  max-width: 10rem;
}

.ua-btn-detalle,
.ua-btn-ed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.36rem 0.72rem;
  font-size: 0.7375rem;
  font-weight: 600;
  border-radius: 8px;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.ua-btn-detalle {
  border: 1px solid var(--color-borde);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-texto-suave);
}

.ua-btn-detalle:hover:not(:disabled) {
  border-color: rgba(124, 140, 240, 0.35);
  color: var(--color-texto);
  background: rgba(124, 140, 240, 0.08);
}

.ua-btn-detalle:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.ua-btn-detalle:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.ua-btn-detalle--pel {
  color: var(--color-peligro);
  border-color: rgba(251, 113, 133, 0.45);
  background: rgba(251, 113, 133, 0.06);
}

.ua-btn-detalle--pel:hover:not(:disabled) {
  background: rgba(251, 113, 133, 0.12);
}

.ua-btn-ed {
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.08);
  color: var(--color-texto);
}

.ua-btn-ed:hover:not(:disabled) {
  border-color: rgba(124, 140, 240, 0.45);
  background: rgba(124, 140, 240, 0.14);
}

.ua-btn-ed:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.ua-btn-ed:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.ua-sw {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  vertical-align: middle;
}

.ua-sw:has(.ua-sw-input:disabled) {
  cursor: not-allowed;
}

.ua-sw-input {
  position: absolute;
  inset: 0;
  width: 2.5rem;
  height: 1.45rem;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.ua-sw-input:disabled {
  cursor: not-allowed;
}

.ua-sw-ui {
  position: relative;
  display: block;
  width: 2.5rem;
  height: 1.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--color-borde);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
}

.ua-sw-ui::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0.2rem;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  background: var(--color-texto-apagado);
  transform: translate(0, -50%);
  transition:
    transform 0.18s ease,
    background 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.ua-sw-input:focus-visible + .ua-sw-ui {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.ua-sw-input:checked + .ua-sw-ui {
  background: rgba(124, 140, 240, 0.35);
  border-color: rgba(124, 140, 240, 0.55);
}

.ua-sw-input:checked + .ua-sw-ui::after {
  transform: translate(1.05rem, -50%);
  background: var(--color-acento-hover);
}

.ua-sw-input:disabled + .ua-sw-ui {
  opacity: 0.42;
  cursor: not-allowed;
}

.ua-sw.ua-sw--compacto .ua-sw-input {
  width: 2.1rem;
  height: 1.2rem;
}

.ua-sw.ua-sw--compacto .ua-sw-ui {
  width: 2.1rem;
  height: 1.2rem;
}

.ua-sw.ua-sw--compacto .ua-sw-ui::after {
  width: 0.88rem;
  height: 0.88rem;
  left: 0.16rem;
}

.ua-sw.ua-sw--compacto .ua-sw-input:checked + .ua-sw-ui::after {
  transform: translate(0.84rem, -50%);
}

.ua-vacio-msg {
  margin: 0;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  padding: 1.5rem 0.75rem;
  border: 1px dashed var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
}

.ua-vacio-msg-tit {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  margin-bottom: 0.35rem;
}

.ua-vacio-msg-det {
  display: block;
  font-size: 0.82rem;
  line-height: 1.45;
  max-width: 22rem;
  margin: 0 auto;
}

.ua-rol-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.ua-rol-pill--admin {
  background: rgba(124, 140, 240, 0.22);
  border-color: rgba(124, 140, 240, 0.42);
  color: var(--color-acento-hover);
}

.ua-rol-pill--dueno {
  background: rgba(234, 179, 8, 0.14);
  border-color: rgba(234, 179, 8, 0.42);
  color: #fbbf24;
}

.ua-rol-pill--empleado {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.28);
  color: var(--color-texto-suave);
}

.ua-chip {
  display: inline-block;
  padding: 0.2rem 0.48rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.ua-chip--si {
  background: rgba(74, 222, 128, 0.16);
  color: var(--color-exito);
}

.ua-chip--no {
  background: rgba(251, 113, 133, 0.14);
  color: var(--color-peligro);
}

.ua-chip--adv {
  background: rgba(220, 180, 70, 0.2);
  color: #e8c96a;
}

.ua-vacio {
  text-align: center;
  padding: 2rem 1.25rem;
  vertical-align: middle;
}

.ua-vacio-tit {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  margin-bottom: 0.35rem;
}

.ua-vacio-det {
  display: block;
  font-size: 0.82rem;
  color: var(--color-texto-apagado);
  line-height: 1.45;
  max-width: 22rem;
  margin: 0 auto;
}

.ua-btn-pri {
  padding: 0.55rem 1.05rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento-intenso));
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.ua-btn-pri--compacto {
  padding: 0.48rem 0.95rem;
  font-size: 0.85rem;
}

.ua-btn-pri--modal {
  min-width: 6.5rem;
}

.ua-btn-pri:hover:not(:disabled) {
  filter: brightness(1.06);
}

.ua-btn-pri:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ua-modal {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
}

.ua-modal:not([open]) {
  display: none;
}

.ua-modal[open] {
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0;
  width: min(34rem, calc(100vw - 1.75rem));
  max-width: min(34rem, calc(100vw - 1.75rem));
  height: fit-content;
  max-height: calc(100dvh - 2rem);
  margin: auto;
  z-index: 9000;
  overflow: hidden;
  border: 1px solid var(--color-acento-borde);
  border-radius: 16px;
  background: var(--color-fondo-elevado);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  color: var(--color-texto);
}

.ua-modal::backdrop {
  background: rgba(7, 11, 20, 0.76);
  backdrop-filter: blur(3px);
}

.ua-modal-panel {
  padding: 1.15rem 1.2rem 1.05rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  max-height: inherit;
}

.ua-modal-cab {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--color-borde);
}

.ua-modal-rubro {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ua-modal-tit {
  margin: 0.3rem 0 0;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.ua-modal-x {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto-apagado);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.ua-modal-x:hover {
  color: var(--color-texto);
  border-color: var(--color-borde);
}
.ua-fs {
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}

.ua-fs--sep {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--color-borde);
}

.ua-legend {
  padding: 0;
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ua-grid-par {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 520px) {
  .ua-grid-par {
    grid-template-columns: 1fr 1fr;
  }
}

.ua-campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.ua-campo .ua-ayuda-mini {
  margin-top: 0.35rem;
}

.ua-etq {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-texto-apagado);
}

.ua-inp {
  width: 100%;
  padding: 0.52rem 0.65rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  font: inherit;
  font-size: 0.9rem;
  color: var(--color-texto);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.ua-inp:hover:not(:disabled) {
  border-color: var(--color-acento-borde);
}

.ua-inp:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 3px var(--color-acento-suave);
}

.ua-inp--mono {
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 0.86rem;
}

.ua-mono {
  font-variant-numeric: tabular-nums;
}

.ua-select {
  cursor: pointer;
}

.ua-chk {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.86rem;
  line-height: 1.45;
  margin-top: 0.65rem;
  cursor: pointer;
}

.ua-chk input {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.ua-chk--deshab {
  opacity: 0.72;
  cursor: default;
}

.ua-ayuda-mini {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.43;
  color: var(--color-texto-apagado);
}

.ua-error {
  margin: 0.85rem 0 0;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radio-control);
  font-size: 0.82rem;
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.08);
  border: 1px solid rgba(251, 113, 133, 0.35);
}

.ua-modal-pie {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: flex-end;
  margin-top: 1.15rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-borde);
  background: linear-gradient(180deg, transparent, rgba(7, 11, 20, 0.35));
}

.ua-btn-sec {
  padding: 0.48rem 0.95rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.ua-btn-sec:hover {
  border-color: var(--color-acento-borde);
  color: var(--color-texto);
}
</style>
