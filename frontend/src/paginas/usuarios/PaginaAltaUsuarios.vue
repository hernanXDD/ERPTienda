<script setup lang="ts">
import { KeyRound, Shield, UserCog, UserRound } from 'lucide-vue-next';
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
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';
import {
  AYUDA_POLITICA_CONTRASENA,
  validarPoliticaContrasena,
} from '../../utilidades/politicaContrasena';

const descripcionPagina = obtenerDescripcionPagina('usuarios-alta');

type ModoFormularioUsuario = 'alta' | 'detalle';

type BorradorUsuarioPersistido = {
  id?: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  rol: RolUsuario;
  habilitado: boolean;
  contrasenaEstaBlanqueada: boolean;
};

const gestionStore = useGestionUsuariosStore();
const sesionStore = useSesionStore();
const { usuarios } = storeToRefs(gestionStore);

const refDialogoUsuario = useTemplateRef<HTMLDialogElement>('refDialogoUsuario');

const modoFormulario = ref<ModoFormularioUsuario>('alta');
const edicionUsuarioActiva = ref(false);
const borradorPersistido = ref<BorradorUsuarioPersistido | null>(null);
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

const formularioUsuarioEditable = computed(
  () => modoFormulario.value === 'alta' || edicionUsuarioActiva.value,
);

const tituloModalUsuario = computed(() => {
  if (modoFormulario.value === 'alta') return 'Nuevo usuario';
  return edicionUsuarioActiva.value ? 'Editar usuario' : 'Detalle del usuario';
});

const nombreCompletoUsuarioBorrador = computed(() => {
  const apellido = borradorApellido.value.trim();
  const nombre = borradorNombre.value.trim();
  if (apellido && nombre) return `${apellido}, ${nombre}`;
  return apellido || nombre;
});

const textoBotonPieSecundario = computed(() => {
  if (modoFormulario.value === 'alta') return 'Cancelar';
  return edicionUsuarioActiva.value ? 'Cancelar' : 'Cerrar';
});

const puedeEditarHabilitadoBorrador = computed(() => {
  if (!formularioUsuarioEditable.value) return false;
  if (!puedeInhabilitar.value) return false;
  const idUsuario = borradorPersistido.value?.id;
  if (idUsuario && idUsuario === idSesionUsuario.value) return false;
  return true;
});

const contrasenaEstaBlanqueadaEnModal = computed(
  () =>
    borradorPersistido.value?.contrasenaEstaBlanqueada ??
    usuarioEnEdicion.value?.contrasenaEstaBlanqueada ??
    false,
);

const usuarioOperadorSesion = computed(() => {
  const id = sesionStore.usuario?.id;
  if (!id) return undefined;
  return gestionStore.obtenerPorId(id);
});

const permisosOperador = computed(() => usuarioOperadorSesion.value?.permisos);

const puedeEditarFichas = computed(
  () => permisosOperador.value?.puedeGestionarFichasDeUsuario ?? false,
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

/** Dueño no ve ni opera sobre cuentas Administrador (política de negocio). */
const sesionEsDueño = computed(() => sesionStore.usuario?.rol === 'DUEÑO');

const rolAdministradorEsSoloLectura = computed(
  () => borradorRol.value === 'ADMIN' || borradorPersistido.value?.rol === 'ADMIN',
);

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

function clonarBorradorPersistido(origen: BorradorUsuarioPersistido): BorradorUsuarioPersistido {
  return { ...origen };
}

function snapshotDesdeUsuario(u: UsuarioGestion): BorradorUsuarioPersistido {
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    nombreUsuario: u.nombreUsuario,
    rol: u.rol,
    habilitado: u.habilitado,
    contrasenaEstaBlanqueada: u.contrasenaEstaBlanqueada,
  };
}

function aplicarBorradorPersistido(origen: BorradorUsuarioPersistido) {
  borradorNombre.value = origen.nombre;
  borradorApellido.value = origen.apellido;
  borradorNombreUsuario.value = origen.nombreUsuario;
  borradorRol.value = origen.rol;
  borradorHabilitado.value = origen.habilitado;
  borradorContrasena.value = '';
  if (origen.id) {
    usuarioEnEdicion.value = gestionStore.obtenerPorId(origen.id) ?? usuarioEnEdicion.value;
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
  edicionUsuarioActiva.value = true;
  usuarioEnEdicion.value = null;
  borradorPersistido.value = null;
  borradorNombre.value = '';
  borradorApellido.value = '';
  borradorNombreUsuario.value = '';
  borradorContrasena.value = '';
  borradorRol.value = 'EMPLEADO';
  borradorHabilitado.value = true;
  mensajeFormulario.value = '';
  nextTick(() => refDialogoUsuario.value?.showModal());
}

function abrirDetalleUsuario(usuarioGestor: UsuarioGestion) {
  if (!puedeEditarFichas.value) return;
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return;
  modoFormulario.value = 'detalle';
  edicionUsuarioActiva.value = false;
  usuarioEnEdicion.value = usuarioGestor;
  const copia = snapshotDesdeUsuario(usuarioGestor);
  borradorPersistido.value = clonarBorradorPersistido(copia);
  aplicarBorradorPersistido(copia);
  mensajeFormulario.value = '';
  nextTick(() => refDialogoUsuario.value?.showModal());
}

function activarEdicionUsuario() {
  if (modoFormulario.value !== 'detalle' || !puedeEditarFichas.value) return;
  mensajeFormulario.value = '';
  edicionUsuarioActiva.value = true;
}

function cancelarEdicionUsuario() {
  if (modoFormulario.value === 'alta') {
    cerrarDialogo();
    return;
  }
  if (!borradorPersistido.value) {
    cerrarDialogo();
    return;
  }
  aplicarBorradorPersistido(borradorPersistido.value);
  mensajeFormulario.value = '';
  edicionUsuarioActiva.value = false;
}

function alPieSecundarioUsuario() {
  if (modoFormulario.value === 'detalle' && edicionUsuarioActiva.value) {
    cancelarEdicionUsuario();
    return;
  }
  cerrarDialogo();
}

function cerrarDialogo() {
  refDialogoUsuario.value?.close();
}

function alCerrarDialogo() {
  usuarioEnEdicion.value = null;
  borradorPersistido.value = null;
  edicionUsuarioActiva.value = false;
  mensajeFormulario.value = '';
}

function validarContrasenaEnFormulario(): string | null {
  const texto = borradorContrasena.value;
  const esAlta = modoFormulario.value === 'alta';
  const requierePorBlanqueo =
    modoFormulario.value === 'detalle' && contrasenaEstaBlanqueadaEnModal.value;

  if (esAlta || requierePorBlanqueo) {
    if (!texto.trim()) {
      return requierePorBlanqueo
        ? 'Debés cargar una contraseña nueva para levantar el bloqueo.'
        : 'La contraseña inicial es obligatoria.';
    }
    return validarPoliticaContrasena(texto);
  }

  if (texto.trim().length > 0) {
    return validarPoliticaContrasena(texto);
  }

  return null;
}

async function guardarFormulario() {
  mensajeFormulario.value = '';

  const errorContrasena = validarContrasenaEnFormulario();
  if (errorContrasena) {
    mensajeFormulario.value = errorContrasena;
    return;
  }

  if (
    (modoFormulario.value === 'alta' || borradorPersistido.value?.rol !== 'ADMIN') &&
    borradorRol.value === 'ADMIN'
  ) {
    mensajeFormulario.value =
      'El rol Administrador no puede asignarse desde la aplicación. Es exclusivo de la cuenta principal del sistema.';
    return;
  }

  if (
    modoFormulario.value === 'detalle' &&
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
    const resultadoAlta = await gestionStore.agregarUsuario(datosAlta);
    if (resultadoAlta !== true) {
      mensajeFormulario.value = resultadoAlta;
      return;
    }
    cerrarDialogo();
    mostrarRetroalimentacionLista('Usuario creado correctamente.');
    return;
  }

  const idUsuario = borradorPersistido.value?.id;
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

  const resultadoEdicion = await gestionStore.actualizarUsuario(idUsuario, datosEdicion);
  if (resultadoEdicion !== true) {
    mensajeFormulario.value = resultadoEdicion;
    return;
  }

  const actualizado = gestionStore.obtenerPorId(idUsuario);
  if (actualizado) {
    usuarioEnEdicion.value = actualizado;
    const guardado = snapshotDesdeUsuario(actualizado);
    borradorPersistido.value = clonarBorradorPersistido(guardado);
    aplicarBorradorPersistido(guardado);
  }
  edicionUsuarioActiva.value = false;
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

  void gestionStore.establecerHabilitacionUsuario(usuarioGestor.id, habilitado).then((res) => {
    if (res !== true) {
      mostrarRetroalimentacionLista(res);
      return;
    }
    mostrarRetroalimentacionLista(
      habilitado
        ? `Usuario "${usuarioGestor.nombreUsuario}" habilitado.`
        : `Usuario "${usuarioGestor.nombreUsuario}" inhabilitado.`,
    );
  });
}

function accionBlanquearCredencial(usuarioGestor: UsuarioGestion) {
  if (!puedeBlanquearContraseniaDe(usuarioGestor)) return;
  if (esAdministradorOcultoParaSesionActual(usuarioGestor)) return;
  const texto =
    'Se bloqueará el acceso con la contraseña actual. El usuario no podrá entrar hasta que alguien con permiso de ficha cargue una contraseña nueva en el detalle.\n\n¿Continuar?';
  if (!window.confirm(texto)) return;

  void gestionStore.blanquearContraseniaUsuario(usuarioGestor.id).then((res) => {
    if (res !== true) {
      mostrarRetroalimentacionLista(res);
      return;
    }
    mostrarRetroalimentacionLista(
      `Contraseña blanqueada para "${usuarioGestor.nombreUsuario}". Asigná una nueva desde Detalle cuando corresponda.`,
    );
  });
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
      `¿Eliminar definitivamente al usuario "${usuarioGestor.nombreUsuario}" (${usuarioGestor.nombre} ${usuarioGestor.apellido})? Esta acción no se puede deshacer.`
    )
  ) {
    return;
  }

  void gestionStore.eliminarUsuario(usuarioGestor.id).then((res) => {
    if (res !== true) {
      mostrarRetroalimentacionLista(res);
      return;
    }
    mostrarRetroalimentacionLista('Usuario eliminado.');
  });
}

/** Reservado: la UI de tarjeta ya no usa este toggle; habilitado solo en modal. */
void onToggleHabilitadoSesion;
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-alta-usuarios">
    <div class="pg-marco pg-marco--tarjetas pg-marco--usuarios">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <UserCog :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Usuarios · Gestión</p>
              <h1 id="titulo-alta-usuarios" class="pg-titulo">Alta y fichas de usuario</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
      </header>

      <p v-if="sesionEsDueño" class="ua-aviso-politica-dueno">
        Con perfil <strong>Dueño</strong>, las cuentas con rol <strong>Administrador</strong> no se listan aquí: las
        gestiona solo quien inicia sesión como administrador.
      </p>

      <p v-if="mensajeListaGlobal" class="ua-retro ua-retro--exito" role="status">{{ mensajeListaGlobal }}</p>
      <p v-if="!puedeEditarFichas" class="ua-aviso-sin_permiso">
        No tenés permiso para alta o edición completa de fichas. Si corresponde, pedí en
        <strong>Permisos usuario</strong>
        las marcas necesarias para tu cuenta.
      </p>

      <div class="pg-barra">
        <div class="pg-barra-fila">
          <div class="pg-barra-col pg-barra-col--busq">
            <label class="pg-filtro-etiq" for="busq-usuario-alta">Buscar</label>
            <input
              id="busq-usuario-alta"
              v-model="busquedaUsuario"
              type="search"
              class="pg-filtro-inp"
              placeholder="Nombre, apellido, usuario de login o rol…"
              autocomplete="off"
            />
          </div>
          <div class="pg-barra-col pg-barra-col--accion ua-barra-acciones">
            <span class="ua-contador" aria-live="polite">
              {{ usuariosFiltradosLista.length }} cuenta{{ usuariosFiltradosLista.length === 1 ? '' : 's' }}
            </span>
            <button
              v-if="puedeEditarFichas"
              type="button"
              class="pg-btn-primario"
              @click="abrirAltaUsuario"
            >
              Nuevo usuario
            </button>
          </div>
        </div>
      </div>

      <section class="pg-cuerpo pg-cuerpo--grilla">
        <div
          v-if="usuariosFiltradosLista.length"
          class="pg-grilla-viewport"
          aria-label="Usuarios del sistema"
        >
          <div class="pg-grilla-wrap">
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
                  <div class="ua-card-estados">
                    <div class="ua-card-fila-estado" aria-label="Estado de sesión">
                      <span class="ua-card-etiq-estado">Sesión</span>
                      <span
                        :class="uFil.habilitado ? 'ua-chip ua-chip--sesion-si' : 'ua-chip ua-chip--sesion-no'"
                      >
                        {{ uFil.habilitado ? 'Habilitado' : 'Inhabilitado' }}
                      </span>
                    </div>
                  </div>
                  <div class="ua-card-acciones">
                    <button
                      type="button"
                      class="ua-btn-detalle"
                      :disabled="!puedeEditarFichas"
                      :title="!puedeEditarFichas ? 'Sin permiso de fichas de usuario' : undefined"
                      @click="abrirDetalleUsuario(uFil)"
                    >
                      Detalle
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
        <p v-else-if="usuariosOrdenados.length" class="pg-vacio--grilla" role="status">
          No hay usuarios que coincidan con la búsqueda.
        </p>
        <div v-else class="pg-vacio--grilla" role="status">
          <span class="pg-vacio--grilla-tit">No hay usuarios</span>
          <span>
            Creá la primera cuenta con «Nuevo usuario» si tenés permiso de fichas.
          </span>
        </div>
      </section>
    </div>

    <Teleport to="body">
      <dialog
        ref="refDialogoUsuario"
        class="ua-modal ua-modal-edicion-usuario"
        aria-labelledby="ua-dlg-tit"
        @close="alCerrarDialogo"
        @cancel.prevent="cerrarDialogo"
      >
        <div v-if="modoFormulario === 'alta' || borradorPersistido" class="ua-ed-panel" @click.stop>
          <header class="ua-ed-cab">
            <div class="ua-ed-cab-marca">
              <p class="ua-ed-eyebrow">Usuarios · gestión de cuentas</p>
              <div class="ua-ed-cab-titular">
                <h2 id="ua-dlg-tit" class="ua-ed-tit">
                  {{ tituloModalUsuario }}
                </h2>
                <button type="button" class="ua-modal-x" aria-label="Cerrar" @click="cerrarDialogo">
                  ×
                </button>
              </div>
              <p v-if="modoFormulario === 'alta'" id="ua-dlg-sub" class="ua-ed-sub">
                Registre los datos personales, credenciales y rol del nuevo usuario.
              </p>
              <p
                v-else-if="nombreCompletoUsuarioBorrador"
                id="ua-dlg-sub"
                class="ua-ed-contexto"
              >
                <span class="ua-ed-contexto-nombre">
                  {{ nombreCompletoUsuarioBorrador }}
                </span>
                <span v-if="borradorNombreUsuario.trim()" class="ua-ed-chip-login ua-ed-inp-mono">
                  {{ borradorNombreUsuario.trim() }}
                </span>
              </p>
              <p v-else id="ua-dlg-sub" class="ua-ed-sub">
                Consulte los datos del usuario seleccionado.
              </p>
            </div>
            <div class="ua-ed-cab-acciones">
              <div class="ua-ed-hab">
                <span id="ua-ed-hab-lbl" class="ua-ed-hab-lbl">Habilitado</span>
                <label
                  class="ua-sw ua-sw--compacto ua-ed-hab-sw"
                  :class="{ 'ua-ed-hab-sw--solo-lectura': !puedeEditarHabilitadoBorrador }"
                  aria-labelledby="ua-ed-hab-lbl"
                  :title="
                    borradorPersistido?.id === idSesionUsuario
                      ? 'No podés cambiar tu propio estado de sesión'
                      : !puedeInhabilitar
                        ? 'Sin permiso para habilitar o inhabilitar sesión'
                        : undefined
                  "
                >
                  <input
                    id="ua-ed-hab"
                    v-model="borradorHabilitado"
                    type="checkbox"
                    class="ua-sw-input"
                    role="switch"
                    :disabled="!puedeEditarHabilitadoBorrador"
                    :aria-label="
                      borradorHabilitado
                        ? 'Cuenta habilitada para iniciar sesión'
                        : 'Cuenta inhabilitada para iniciar sesión'
                    "
                  />
                  <span class="ua-sw-ui" aria-hidden="true" />
                </label>
              </div>
            </div>
          </header>

          <div class="ua-ed-bandera" aria-hidden="true" />

          <form
            class="ua-ed-form"
            :class="{ 'ua-ed-form--solo-lectura': !formularioUsuarioEditable }"
            aria-describedby="ua-dlg-sub"
            @submit.prevent="guardarFormulario"
          >
            <div class="ua-ed-cuerpo">
              <section class="ua-ed-bloque" aria-labelledby="ua-sec-personal">
                <header class="ua-ed-bloque-cab">
                  <UserRound class="ua-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="ua-ed-bloque-txt">
                    <h3 id="ua-sec-personal" class="ua-ed-bloque-tit">Datos personales</h3>
                    <p class="ua-ed-bloque-desc">Nombre y apellido visibles en la ficha</p>
                  </div>
                </header>
                <div class="ua-ed-fila ua-ed-fila--personal">
                  <div class="ua-ed-campo">
                    <label class="ua-ed-etiq" for="ua-ed-nombre">Nombre</label>
                    <input
                      id="ua-ed-nombre"
                      v-model="borradorNombre"
                      type="text"
                      class="ua-ed-inp"
                      required
                      maxlength="64"
                      autocomplete="given-name"
                      placeholder="Ej. María"
                      :disabled="!formularioUsuarioEditable"
                    />
                  </div>
                  <div class="ua-ed-campo">
                    <label class="ua-ed-etiq" for="ua-ed-apellido">Apellido</label>
                    <input
                      id="ua-ed-apellido"
                      v-model="borradorApellido"
                      type="text"
                      class="ua-ed-inp"
                      required
                      maxlength="64"
                      autocomplete="family-name"
                      placeholder="Ej. González"
                      :disabled="!formularioUsuarioEditable"
                    />
                  </div>
                </div>
              </section>

              <section class="ua-ed-bloque" aria-labelledby="ua-sec-cred">
                <header class="ua-ed-bloque-cab">
                  <KeyRound class="ua-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="ua-ed-bloque-txt">
                    <h3 id="ua-sec-cred" class="ua-ed-bloque-tit">Credenciales</h3>
                    <p class="ua-ed-bloque-desc">Usuario de login y contraseña de acceso</p>
                  </div>
                </header>
                <div class="ua-ed-fila ua-ed-fila--cred">
                  <div class="ua-ed-campo">
                    <label class="ua-ed-etiq" for="ua-ed-login">Nombre de usuario (login)</label>
                    <input
                      id="ua-ed-login"
                      v-model="borradorNombreUsuario"
                      type="text"
                      class="ua-ed-inp ua-ed-inp-mono"
                      required
                      maxlength="48"
                      autocomplete="username"
                      spellcheck="false"
                      placeholder="ej. mgonzalez"
                      :disabled="!formularioUsuarioEditable"
                    />
                  </div>
                  <div class="ua-ed-campo">
                    <label class="ua-ed-etiq" for="ua-ed-pass">
                      {{
                        modoFormulario === 'alta'
                          ? 'Contraseña inicial'
                          : formularioUsuarioEditable
                            ? 'Nueva contraseña (opcional)'
                            : 'Contraseña'
                      }}
                    </label>
                    <input
                      v-if="formularioUsuarioEditable"
                      id="ua-ed-pass"
                      v-model="borradorContrasena"
                      type="password"
                      :required="modoFormulario === 'alta'"
                      class="ua-ed-inp"
                      maxlength="72"
                      autocomplete="new-password"
                      :placeholder="
                        modoFormulario === 'detalle'
                          ? contrasenaEstaBlanqueadaEnModal
                            ? 'Debés cargar nueva contraseña para levantar el bloqueo…'
                            : 'Dejar vacío para no cambiar…'
                          : 'Ej. MiTienda2026'
                      "
                    />
                    <p v-if="formularioUsuarioEditable" class="ua-ed-ayuda-pass">
                      {{ AYUDA_POLITICA_CONTRASENA }}
                    </p>
                    <input
                      v-else
                      id="ua-ed-pass"
                      type="text"
                      class="ua-ed-inp ua-ed-inp-mono"
                      value=""
                      disabled
                      placeholder="••••••••"
                      aria-describedby="ua-ed-pass-nota"
                    />
                    <p
                      v-if="!formularioUsuarioEditable"
                      id="ua-ed-pass-nota"
                      class="ua-ed-nota ua-ed-nota--inline"
                    >
                      La contraseña no se muestra por seguridad.
                    </p>
                    <p
                      v-else-if="modoFormulario === 'detalle' && contrasenaEstaBlanqueadaEnModal"
                      class="ua-ed-nota ua-ed-nota--inline"
                    >
                      La credencial fue blanqueada: cargá obligatoriamente una contraseña nueva al guardar o el usuario
                      sigue sin poder ingresar.
                    </p>
                  </div>
                </div>
              </section>

              <section class="ua-ed-bloque" aria-labelledby="ua-sec-rol">
                <header class="ua-ed-bloque-cab">
                  <Shield class="ua-ed-bloque-ico" aria-hidden="true" :size="18" stroke-width="2.1" />
                  <div class="ua-ed-bloque-txt">
                    <h3 id="ua-sec-rol" class="ua-ed-bloque-tit">Rol y permisos</h3>
                    <p class="ua-ed-bloque-desc">Rol base del usuario en el sistema</p>
                  </div>
                </header>
                <div class="ua-ed-fila ua-ed-fila--rol">
                  <div class="ua-ed-campo ua-ed-campo--rol">
                    <label class="ua-ed-etiq" for="ua-ed-rol">Rol en el sistema</label>
                    <p
                      v-if="rolAdministradorEsSoloLectura"
                      id="ua-ed-rol"
                      class="ua-ed-inp ua-ed-inp--rol-fijo"
                      aria-label="Rol en el sistema"
                    >
                      {{ etiquetaRolUsuario('ADMIN') }}
                    </p>
                    <select
                      v-else
                      id="ua-ed-rol"
                      v-model="borradorRol"
                      class="ua-ed-inp ua-ed-select"
                      :disabled="!formularioUsuarioEditable"
                    >
                      <option value="DUEÑO">Dueño</option>
                      <option value="EMPLEADO">Empleado</option>
                    </select>
                    <p v-if="rolAdministradorEsSoloLectura" class="ua-ed-nota ua-ed-nota--inline">
                      El rol Administrador es exclusivo de la cuenta principal del sistema y no puede asignarse a otras
                      cuentas.
                    </p>
                    <p v-if="!puedeInhabilitar && formularioUsuarioEditable" class="ua-ed-nota ua-ed-nota--inline">
                      No podés cambiar el estado de sesión desde el formulario. Pedí permiso para «inhabilitar usuario»
                      si lo necesitás.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <p v-if="mensajeFormulario" class="ua-ed-error-general" role="alert">{{ mensajeFormulario }}</p>

            <footer class="ua-ed-pie">
              <button type="button" class="ua-btn-sec" @click="alPieSecundarioUsuario">
                {{ textoBotonPieSecundario }}
              </button>
              <button
                v-if="formularioUsuarioEditable"
                type="submit"
                class="ua-btn-pri"
                :disabled="
                  modoFormulario === 'detalle' &&
                  contrasenaEstaBlanqueadaEnModal &&
                  borradorContrasena.trim().length === 0
                "
              >
                {{ modoFormulario === 'alta' ? 'Crear usuario' : 'Guardar cambios' }}
              </button>
              <button
                v-else-if="puedeEditarFichas"
                type="button"
                class="ua-btn-pri"
                @click="activarEdicionUsuario"
              >
                Editar
              </button>
            </footer>
          </form>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>

<style scoped>
.pg-marco--usuarios {
  --pg-grilla-altura-fila: 10.85rem;
  --pg-reserva-vertical-vista: clamp(13rem, 26dvh, 19.5rem);
}

.pg-marco--usuarios .ua-aviso-politica-dueno,
.pg-marco--usuarios .ua-retro,
.pg-marco--usuarios .ua-aviso-sin_permiso {
  margin: 0 clamp(1rem, 3vw, 1.65rem);
}

.pg-marco--usuarios .ua-barra-acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 0.65rem;
}

.pg-marco--usuarios .pg-barra-col--accion .pg-btn-primario {
  width: 100%;
}

@media (min-width: 720px) {
  .pg-marco--usuarios .pg-barra-col--accion .pg-btn-primario {
    width: auto;
    min-width: 10.5rem;
  }
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

.ua-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: var(--pg-grilla-altura-fila);
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

.ua-card-fila-estado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  min-width: 0;
}

.ua-card-estados {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  flex-shrink: 0;
  min-width: 0;
}

.ua-card-etiq-estado {
  font-size: 0.54rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-texto-apagado);
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

  .ua-card-acciones .ua-btn-detalle {
    flex: 1;
    justify-content: center;
  }
}

.ua-card-acciones {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-left: auto;
  justify-content: flex-end;
}

.ua-btn-detalle {
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
  cursor: default;
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
  display: inline-flex;
  align-items: center;
  padding: 0.17rem 0.48rem;
  border-radius: 999px;
  font-size: 0.6275rem;
  font-weight: 700;
  letter-spacing: 0.015em;
  border: 1px solid transparent;
}

.ua-chip--sesion-si {
  background: rgba(124, 140, 240, 0.22);
  border-color: rgba(124, 140, 240, 0.35);
  color: var(--color-acento-hover);
}

.ua-chip--sesion-no {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-borde);
  color: var(--color-texto-apagado);
}

.ua-chip--adv {
  background: rgba(220, 180, 70, 0.2);
  color: #e8c96a;
  border-radius: 6px;
}

.ua-mono {
  font-variant-numeric: tabular-nums;
}

.pg-filtro-etiq {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-texto-apagado);
}

.pg-filtro-inp {
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

.pg-filtro-inp:hover:not(:disabled) {
  border-color: var(--color-acento-borde);
}

.pg-filtro-inp:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 3px var(--color-acento-suave);
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
  height: fit-content;
  max-height: calc(100dvh - 1.5rem);
  margin: auto;
  z-index: 9000;
  overflow: hidden;
  border: 1px solid var(--color-borde);
  border-radius: 16px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow:
    0 0 0 1px rgba(124, 140, 240, 0.08),
    0 28px 64px rgba(0, 0, 0, 0.58);
}

.ua-modal::backdrop {
  background: rgba(7, 11, 20, 0.76);
  backdrop-filter: blur(3px);
}

.ua-modal-edicion-usuario[open] {
  width: min(56rem, calc(100vw - 2rem));
  max-width: min(56rem, calc(100vw - 2rem));
  min-height: min(28rem, calc(100dvh - 2.5rem));
  max-height: calc(100dvh - 1.25rem);
}

@media (min-width: 1200px) {
  .ua-modal-edicion-usuario[open] {
    width: min(62rem, calc(100vw - 3rem));
    max-width: min(62rem, calc(100vw - 3rem));
  }
}

.ua-ed-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-height: min(28rem, calc(100dvh - 2.5rem));
  max-height: calc(100dvh - 1.25rem);
  overflow: hidden;
  background:
    radial-gradient(
      ellipse 140% 90% at 100% -30%,
      rgba(124, 140, 240, 0.11),
      transparent 55%
    ),
    radial-gradient(
      ellipse 80% 60% at 0% 100%,
      rgba(124, 140, 240, 0.05),
      transparent 50%
    ),
    var(--color-fondo-elevado);
}

.ua-ed-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.25rem;
  flex-shrink: 0;
  padding: 1.15rem clamp(1.35rem, 3.5vw, 2rem) 0.65rem;
}

.ua-ed-cab-marca {
  min-width: 0;
  flex: 1;
}

.ua-ed-cab-titular {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
}

.ua-ed-cab-acciones {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.ua-ed-hab {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.38rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(42, 58, 84, 0.75);
  background: rgba(21, 29, 46, 0.55);
}

.ua-ed-hab:has(.ua-sw-input:checked) {
  border-color: rgba(124, 140, 240, 0.38);
  background: rgba(124, 140, 240, 0.1);
}

.ua-ed-hab-lbl {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  user-select: none;
}

.ua-ed-hab:has(.ua-sw-input:checked) .ua-ed-hab-lbl {
  color: var(--color-texto);
}

.ua-ed-hab-sw--solo-lectura {
  cursor: default;
  opacity: 0.88;
}

.ua-ed-hab-sw--solo-lectura .ua-sw-input:disabled {
  cursor: default;
}

.ua-ed-eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  color: rgba(139, 156, 179, 0.95);
}

.ua-ed-tit {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.2;
  color: var(--color-texto);
}

.ua-ed-sub {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
  max-width: 58ch;
}

.ua-ed-contexto {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.75rem;
  margin: 0.55rem 0 0;
}

.ua-ed-contexto-nombre {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-texto-suave);
  line-height: 1.35;
}

.ua-ed-chip-login {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.1);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-acento-hover);
}

.ua-ed-bandera {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(124, 140, 240, 0.12),
    rgba(154, 124, 240, 0.62),
    rgba(124, 140, 240, 0.18)
  );
}

.ua-ed-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.ua-ed-cuerpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.1rem clamp(1.35rem, 3.5vw, 2rem) 1.15rem;
}

@media (max-width: 899px) {
  .ua-modal-edicion-usuario[open] {
    width: min(48rem, calc(100vw - 1.25rem));
    max-width: min(48rem, calc(100vw - 1.25rem));
    min-height: 0;
  }

  .ua-ed-panel {
    min-height: 0;
  }

  .ua-ed-cuerpo {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

@media (max-width: 900px) {
  .ua-ed-cab {
    flex-direction: column;
    align-items: stretch;
    gap: 0.65rem;
    padding: 0.85rem 1rem 0.55rem;
  }

  .ua-ed-cab-acciones {
    justify-content: flex-start;
  }

  .ua-ed-eyebrow {
    margin-bottom: 0.28rem;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
  }

  .ua-ed-tit {
    font-size: 1.08rem;
    line-height: 1.25;
  }

  .ua-ed-contexto {
    margin-top: 0.4rem;
    gap: 0.4rem 0.55rem;
  }

  .ua-ed-contexto-nombre {
    font-size: 0.86rem;
  }

  .ua-ed-chip-login {
    font-size: 0.75rem;
  }
}

.ua-ed-bloque {
  flex-shrink: 0;
  border-radius: 14px;
  border: 1px solid rgba(42, 58, 84, 0.8);
  background: rgba(7, 11, 20, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  overflow: hidden;
}

.ua-ed-bloque-cab {
  display: flex;
  align-items: flex-start;
  gap: 0.72rem;
  padding: 0.85rem 1.1rem 0.75rem;
  border-bottom: 1px solid rgba(42, 58, 84, 0.65);
  background: rgba(21, 29, 46, 0.48);
}

.ua-ed-bloque-ico {
  flex-shrink: 0;
  margin-top: 0.12rem;
  color: var(--color-acento-hover);
  opacity: 0.95;
}

.ua-ed-bloque-txt {
  min-width: 0;
  flex: 1;
}

.ua-ed-bloque-tit {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: var(--color-texto);
}

.ua-ed-bloque-desc {
  margin: 0.22rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.ua-ed-fila {
  display: grid;
  gap: 0.85rem 1.1rem;
  padding: 1rem 1.1rem 1.1rem;
}

.ua-ed-fila--personal,
.ua-ed-fila--cred {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ua-ed-fila--rol {
  grid-template-columns: minmax(0, 0.65fr);
}

@media (max-width: 599px) {
  .ua-ed-fila--personal,
  .ua-ed-fila--cred {
    grid-template-columns: 1fr;
  }
}

.ua-ed-campo {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  min-width: 0;
}

.ua-ed-etiq {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-texto-suave);
}

.ua-ed-ayuda-pass {
  margin: 0.2rem 0 0;
  font-size: 0.76rem;
  line-height: 1.4;
  color: var(--color-texto-apagado);
}

.ua-ed-inp {
  width: 100%;
  padding: 0.62rem 0.78rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9375rem;
  line-height: 1.35;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.ua-ed-inp:hover:not(:disabled) {
  border-color: rgba(124, 140, 240, 0.32);
}

.ua-ed-inp:focus {
  outline: none;
  border-color: var(--color-acento);
  box-shadow: 0 0 0 3px rgba(124, 140, 240, 0.2);
}

.ua-ed-form--solo-lectura .ua-ed-inp:disabled {
  opacity: 1;
  cursor: default;
  color: var(--color-texto-suave);
  background: rgba(7, 11, 20, 0.38);
  border-color: rgba(42, 58, 84, 0.55);
  box-shadow: none;
}

.ua-ed-form--solo-lectura .ua-ed-inp:disabled::placeholder {
  color: var(--color-texto-apagado);
}

.ua-ed-inp-mono {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 0.875rem;
}

.ua-ed-inp--rol-fijo {
  margin: 0;
  font-weight: 600;
  color: var(--color-texto);
  background: rgba(7, 11, 20, 0.38);
  border-color: rgba(42, 58, 84, 0.55);
  cursor: default;
}

.ua-ed-select {
  cursor: pointer;
}

.ua-ed-form--solo-lectura .ua-ed-select:disabled {
  cursor: default;
}

.ua-ed-nota {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
}

.ua-ed-nota--inline {
  margin-top: 0.15rem;
}

.ua-ed-error-general {
  flex-shrink: 0;
  margin: 0 clamp(1.35rem, 3.5vw, 2rem);
  padding: 0.58rem 0.72rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.35);
}

.ua-ed-pie {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 1rem clamp(1.35rem, 3.5vw, 2rem) 1.25rem;
  border-top: 1px solid rgba(42, 58, 84, 0.85);
  background: rgba(21, 29, 46, 0.72);
  box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.2);
}

.ua-modal-x {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: -0.1rem;
  padding: 0.2rem 0.35rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.ua-modal-x:hover {
  color: var(--color-texto);
  background: rgba(255, 255, 255, 0.06);
}

.ua-btn-sec {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.88rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.08s ease;
}

.ua-btn-pri {
  padding: 0.52rem 1.05rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  color: var(--color-texto-sobre-acento);
  background: var(--color-acento);
  cursor: pointer;
  transition: transform 0.08s ease;
}

.ua-btn-pri:hover:not(:disabled) {
  background: var(--color-acento-hover);
}

.ua-btn-pri:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ua-btn-sec:active,
.ua-btn-pri:active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .ua-card {
    transition: none;
  }

  .ua-card:hover {
    transform: none;
  }

  .ua-btn-sec,
  .ua-btn-pri {
    transition: none;
  }

  .ua-btn-sec:active,
  .ua-btn-pri:active {
    transform: none;
  }
}
</style>
