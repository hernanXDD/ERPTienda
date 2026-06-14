<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LayoutGrid, ShieldCheck } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  menusVisiblesPorDefecto,
  menusVisiblesResueltos,
  permisosPorDefectoSegunRol,
} from '../../modulos/usuarios/permisosUsuario';
import {
  contarPermisosOperativosActivos,
  DEFINICIONES_MENU_PERMISO,
  etiquetaSensibilidadPermiso,
  GRUPOS_PERMISOS_OPERATIVOS,
} from '../../modulos/usuarios/catalogoPermisosUsuario';
import { etiquetaRolUsuario } from '../../datos/etiquetasRolUsuario';
import {
  claveMenuRequeridaPorRuta,
  primeraRutaNombreSegunMenus,
  ORDEN_CLAVES_MENU_PRINCIPAL,
} from '../../modulos/nucleo/menuPrincipal';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useSesionStore } from '../../stores/sesion';
import type {
  MenusVisiblesUsuario,
  PermisosOperativosUsuario,
  UsuarioGestion,
} from '../../tipos/usuarioGestion';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('usuarios-permisos');

const gestionStore = useGestionUsuariosStore();
const sesionStore = useSesionStore();
const configuracionSistemaStore = useConfiguracionSistemaStore();
const router = useRouter();
const route = useRoute();
const { usuarios } = storeToRefs(gestionStore);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);

const movimientoManualHabilitadoEnSistema = computed(
  () => parametrosSistema.value.movimientoManualStockHabilitado,
);

function permisoDeshabilitadoPorSistema(clave: keyof PermisosOperativosUsuario): boolean {
  return clave === 'puedeMoverStockManualmente' && !movimientoManualHabilitadoEnSistema.value;
}

const mensajeExito = ref('');
const tipoMensaje = ref<'ok' | 'info' | 'error'>('ok');
const modoEdicionPermisos = ref(false);
const guardandoPermisos = ref(false);

let temporizadorRetroalimentacion: ReturnType<typeof globalThis.setTimeout> | undefined;

function mostrarRetroalimentacionBreve(texto: string, tipo: 'ok' | 'info' | 'error' = 'ok') {
  mensajeExito.value = texto;
  tipoMensaje.value = tipo;
  if (temporizadorRetroalimentacion) globalThis.clearTimeout(temporizadorRetroalimentacion);
  temporizadorRetroalimentacion = globalThis.setTimeout(() => {
    if (mensajeExito.value === texto) mensajeExito.value = '';
  }, 2400);
}

function sincronizarBorradorDesdeUsuarioEnStore() {
  const usuario = usuarioSeleccionado.value;
  if (!usuario) return;
  const actualizado = gestionStore.obtenerPorId(usuario.id);
  if (!actualizado) return;
  borradorPermisos.value = {
    ...actualizado.permisos,
    menusVisibles: menusVisiblesResueltos(actualizado.permisos.menusVisibles),
  };
}

function salirModoEdicionPermisos(): void {
  modoEdicionPermisos.value = false;
}

/** Si editás tu propia cuenta y cerrás el menú de la pantalla actual, te lleva a una ruta permitida. */
function redirigirSiSesionPerdioAccesoARutaActual() {
  const idSesion = sesionStore.usuario?.id;
  if (!idSesion || usuarioSeleccionado.value?.id !== idSesion) return;

  const actualizado = gestionStore.obtenerPorId(idSesion);
  if (!actualizado) return;

  const menus = menusVisiblesResueltos(actualizado.permisos.menusVisibles);
  const clave = claveMenuRequeridaPorRuta(route.name);
  if (clave && !menus[clave]) {
    const destino = primeraRutaNombreSegunMenus(menus, sesionStore.usuario);
    if (destino !== route.name) {
      void router.replace({ name: destino });
    }
  }
}

function iniciarEdicionPermisos(): void {
  if (!usuarioSeleccionado.value) return;
  sincronizarBorradorDesdeUsuarioEnStore();
  mensajeExito.value = '';
  modoEdicionPermisos.value = true;
}

function manejarAccionPermisos(): void {
  if (modoEdicionPermisos.value) {
    guardarCambiosPermisos();
  } else {
    iniciarEdicionPermisos();
  }
}

const idUsuarioSeleccionado = ref('');
const borradorPermisos = ref<PermisosOperativosUsuario>({
  ...permisosPorDefectoSegunRol('EMPLEADO'),
  menusVisibles: menusVisiblesPorDefecto(),
});

const sesionEsDueño = computed(() => sesionStore.usuario?.rol === 'DUEÑO');

function esAdministradorOcultoParaSesionActual(usuarioGestor: UsuarioGestion): boolean {
  return sesionEsDueño.value && usuarioGestor.rol === 'ADMIN';
}

const usuariosOrdenados = computed(() =>
  [...usuarios.value]
    .filter((u) => !esAdministradorOcultoParaSesionActual(u))
    .sort((a, b) =>
      a.nombreUsuario.localeCompare(b.nombreUsuario, 'es', { sensitivity: 'base' })
    )
);

const usuarioSeleccionado = computed(() => {
  const id = idUsuarioSeleccionado.value;
  if (!id) return null;
  return usuarios.value.find((u) => u.id === id) ?? null;
});

const cantidadMenusVisiblesActivos = computed(() => {
  const menus = menusVisiblesResueltos(borradorPermisos.value.menusVisibles);
  return ORDEN_CLAVES_MENU_PRINCIPAL.filter((clave) => menus[clave]).length;
});

const cantidadPermisosOperativosActivos = computed(() =>
  contarPermisosOperativosActivos(borradorPermisos.value)
);

const hayCambiosPendientes = computed(() => {
  const usuario = usuarioSeleccionado.value;
  if (!usuario) return false;
  const siguiente: PermisosOperativosUsuario = {
    ...borradorPermisos.value,
    menusVisibles: menusVisiblesResueltos(borradorPermisos.value.menusVisibles),
  };
  return !igualALosGuardados(siguiente, usuario.permisos);
});

watch(
  usuariosOrdenados,
  (lista) => {
    if (!lista.length) {
      idUsuarioSeleccionado.value = '';
      return;
    }
    const sigueSiendoValido = lista.some((u) => u.id === idUsuarioSeleccionado.value);
    if (!idUsuarioSeleccionado.value || !sigueSiendoValido) {
      idUsuarioSeleccionado.value = lista[0].id;
    }
  },
  { immediate: true }
);

watch(
  usuarioSeleccionado,
  (usuario) => {
    if (!usuario) {
      salirModoEdicionPermisos();
      return;
    }
    salirModoEdicionPermisos();
    const permisosResueltos: PermisosOperativosUsuario = {
      ...usuario.permisos,
      menusVisibles: menusVisiblesResueltos(usuario.permisos.menusVisibles),
    };
    borradorPermisos.value = permisosResueltos;
  },
  { immediate: true }
);

function menusVisiblesIguales(a: MenusVisiblesUsuario, b: MenusVisiblesUsuario): boolean {
  return ORDEN_CLAVES_MENU_PRINCIPAL.every((clave) => a[clave] === b[clave]);
}

function igualALosGuardados(
  permisosA: PermisosOperativosUsuario,
  permisosB: PermisosOperativosUsuario
): boolean {
  const menusA = menusVisiblesResueltos(permisosA.menusVisibles);
  const menusB = menusVisiblesResueltos(permisosB.menusVisibles);
  return (
    permisosA.puedeAjustarStock === permisosB.puedeAjustarStock &&
    permisosA.puedeMoverStockManualmente === permisosB.puedeMoverStockManualmente &&
    permisosA.puedeRegistrarCompras === permisosB.puedeRegistrarCompras &&
    permisosA.puedeGestionarCatalogoProductos === permisosB.puedeGestionarCatalogoProductos &&
    permisosA.puedeGestionarFichasDeUsuario === permisosB.puedeGestionarFichasDeUsuario &&
    permisosA.puedeInhabilitarUsuario === permisosB.puedeInhabilitarUsuario &&
    permisosA.puedeEliminarUsuario === permisosB.puedeEliminarUsuario &&
    permisosA.puedeBlanquearContrasenaUsuario === permisosB.puedeBlanquearContrasenaUsuario &&
    menusVisiblesIguales(menusA, menusB)
  );
}

function guardarCambiosPermisos(): void {
  const usuario = usuarioSeleccionado.value;
  if (!usuario || guardandoPermisos.value) return;

  const siguiente: PermisosOperativosUsuario = {
    ...borradorPermisos.value,
    menusVisibles: menusVisiblesResueltos(borradorPermisos.value.menusVisibles),
  };

  if (igualALosGuardados(siguiente, usuario.permisos)) {
    salirModoEdicionPermisos();
    mostrarRetroalimentacionBreve('No hay cambios que guardar.', 'info');
    return;
  }

  guardandoPermisos.value = true;
  void gestionStore.actualizarPermisosUsuario(usuario.id, siguiente).then((guardadoOk) => {
    guardandoPermisos.value = false;
    if (!guardadoOk) {
      sincronizarBorradorDesdeUsuarioEnStore();
      mostrarRetroalimentacionBreve(
        'No se pudieron guardar los permisos. Verificá que el usuario siga existiendo y que tengas autorización.',
        'error',
      );
      return;
    }

    salirModoEdicionPermisos();
    redirigirSiSesionPerdioAccesoARutaActual();
    mostrarRetroalimentacionBreve('Permisos guardados correctamente.', 'ok');
  });
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="tit-permisos-usuarios">
    <div class="pg-marco pg-marco--permisos">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <ShieldCheck :size="22" class="pg-cab-ico" aria-hidden="true" stroke-width="1.85" />
            <div>
              <p class="pg-eyebrow">Usuarios · Gestión</p>
              <h1 id="tit-permisos-usuarios" class="pg-titulo">Permisos por cuenta</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
            </div>
          </div>
        </div>
        <div v-if="usuarioSeleccionado" class="pg-kpis" aria-label="Resumen de permisos">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Menús visibles</span>
            <span class="pg-kpi-valor pg-mono">{{ cantidadMenusVisiblesActivos }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Permisos operativos</span>
            <span class="pg-kpi-valor pg-mono">{{ cantidadPermisosOperativosActivos }}</span>
          </div>
          <div class="pg-kpi" :class="{ 'pg-kpi--peligro': !usuarioSeleccionado.habilitado }">
            <span class="pg-kpi-etiq">Estado sesión</span>
            <span class="pg-kpi-valor perm-kpi-estado">
              {{ usuarioSeleccionado.habilitado ? 'Habilitada' : 'Inhabilitada' }}
            </span>
          </div>
        </div>
        <div v-else class="pg-kpis" aria-label="Resumen de usuarios">
          <div class="pg-kpi pg-kpi--acento">
            <span class="pg-kpi-etiq">Cuentas</span>
            <span class="pg-kpi-valor pg-mono">{{ usuariosOrdenados.length }}</span>
          </div>
        </div>
      </header>

      <p v-if="sesionEsDueño" class="perm-aviso-dueno">
        Con perfil <strong>Dueño</strong> no se listan cuentas con rol
        <strong>Administrador</strong>.
      </p>

      <div class="pg-barra">
        <div class="pg-barra-fila">
          <div class="pg-barra-col pg-barra-col--filtro">
            <label class="pg-filtro-etiq" for="select-usuario-permisos">Cuenta a configurar</label>
            <select
              id="select-usuario-permisos"
              v-model="idUsuarioSeleccionado"
              class="pg-filtro-inp pg-filtro-sel perm-select-usuario"
              :disabled="usuariosOrdenados.length === 0 || modoEdicionPermisos"
            >
              <option v-for="u in usuariosOrdenados" :key="u.id" :value="u.id">
                {{ u.apellido }}, {{ u.nombre }} (@{{ u.nombreUsuario }})
              </option>
            </select>
          </div>
          <div class="pg-barra-col pg-barra-col--accion">
            <span class="pg-filtro-etiq pg-sr">Acción</span>
            <button
              type="button"
              class="pg-btn-primario"
              :disabled="!usuarioSeleccionado || guardandoPermisos"
              :aria-busy="guardandoPermisos"
              @click="manejarAccionPermisos"
            >
              {{
                guardandoPermisos
                  ? 'Guardando…'
                  : modoEdicionPermisos
                    ? 'Guardar cambios'
                    : 'Editar permisos de usuario'
              }}
            </button>
          </div>
        </div>
        <p
          v-if="mensajeExito"
          class="perm-aviso"
          :class="`perm-aviso--${tipoMensaje}`"
          role="status"
        >
          {{ mensajeExito }}
        </p>
      </div>

      <template v-if="usuarioSeleccionado">
        <div class="perm-ficha" aria-label="Usuario seleccionado">
          <div class="perm-ficha-ident">
            <p class="perm-ficha-nombre">
              {{ usuarioSeleccionado.nombre }} {{ usuarioSeleccionado.apellido }}
            </p>
            <p class="perm-ficha-login pg-mono">@{{ usuarioSeleccionado.nombreUsuario }}</p>
          </div>
          <div class="perm-ficha-chips">
            <span class="perm-chip perm-chip--rol">
              {{ etiquetaRolUsuario(usuarioSeleccionado.rol) }}
            </span>
            <span
              class="perm-chip"
              :class="
                usuarioSeleccionado.habilitado
                  ? 'perm-chip--habilitado'
                  : 'perm-chip--inhabilitado'
              "
            >
              {{
                usuarioSeleccionado.habilitado
                  ? 'Puede iniciar sesión'
                  : 'Cuenta inhabilitada'
              }}
            </span>
            <span v-if="modoEdicionPermisos" class="perm-chip perm-chip--edicion">
              Modo edición
            </span>
            <span v-if="modoEdicionPermisos && hayCambiosPendientes" class="perm-chip perm-chip--pendiente">
              Cambios pendientes de guardar
            </span>
          </div>
        </div>

        <fieldset
          class="perm-cuerpo"
          :class="{ 'perm-cuerpo--solo-lectura': !modoEdicionPermisos }"
          :disabled="!modoEdicionPermisos"
        >
          <section class="perm-bloque perm-bloque--menus" aria-labelledby="perm-sec-menus">
            <header class="perm-bloque-enc">
              <span class="perm-bloque-ico" aria-hidden="true">
                <LayoutGrid :size="16" stroke-width="2" />
              </span>
              <h2 id="perm-sec-menus" class="perm-bloque-tit">Módulos del menú</h2>
              <span class="perm-bloque-badge" aria-label="Módulos activos">
                {{ cantidadMenusVisiblesActivos }}/{{ DEFINICIONES_MENU_PERMISO.length }}
              </span>
            </header>

            <ul class="perm-malla-modulos" role="list">
              <li
                v-for="menu in DEFINICIONES_MENU_PERMISO"
                :key="menu.clave"
                class="perm-item perm-item--menu"
                :class="{ 'perm-item--activo': borradorPermisos.menusVisibles[menu.clave] }"
              >
                <span class="perm-item-ico" aria-hidden="true">
                  <component :is="menu.icono" :size="16" stroke-width="1.85" />
                </span>
                <div class="perm-item-info">
                  <p class="perm-item-tit" :id="`lbl-menu-${menu.clave}`">{{ menu.etiqueta }}</p>
                  <p class="perm-item-resumen">{{ menu.resumen }}</p>
                </div>
                <label class="perm-sw">
                  <input
                    v-model="borradorPermisos.menusVisibles[menu.clave]"
                    type="checkbox"
                    class="perm-sw-input"
                    role="switch"
                    :aria-labelledby="`lbl-menu-${menu.clave}`"
                  />
                  <span class="perm-sw-ui" aria-hidden="true" />
                </label>
              </li>
            </ul>
          </section>

          <section
            v-for="grupo in GRUPOS_PERMISOS_OPERATIVOS"
            :key="grupo.id"
            class="perm-bloque"
            :class="{ 'perm-bloque--adm': grupo.id === 'usuarios' }"
            :aria-labelledby="`perm-sec-${grupo.id}`"
          >
            <header class="perm-bloque-enc">
              <span class="perm-bloque-ico" aria-hidden="true">
                <component :is="grupo.icono" :size="16" stroke-width="2" />
              </span>
              <h2 :id="`perm-sec-${grupo.id}`" class="perm-bloque-tit">{{ grupo.titulo }}</h2>
              <span class="perm-bloque-badge" :aria-label="`Permisos activos en ${grupo.titulo}`">
                {{
                  grupo.permisos.filter((p) => borradorPermisos[p.clave]).length
                }}/{{ grupo.permisos.length }}
              </span>
            </header>

            <ul class="perm-lista-acciones" role="list">
              <li
                v-for="permiso in grupo.permisos"
                :key="permiso.clave"
                class="perm-item perm-item--accion"
                :class="{
                  'perm-item--activo': borradorPermisos[permiso.clave],
                  [`perm-item--${permiso.sensibilidad}`]: true,
                }"
              >
                <div class="perm-item-info">
                  <div class="perm-item-cab">
                    <p class="perm-item-tit" :id="`lbl-p-${permiso.clave}`">
                      {{ permiso.etiqueta }}
                    </p>
                    <span
                      v-if="permiso.sensibilidad !== 'normal'"
                      class="perm-item-nivel"
                      :class="`perm-item-nivel--${permiso.sensibilidad}`"
                    >
                      {{ etiquetaSensibilidadPermiso(permiso.sensibilidad) }}
                    </span>
                  </div>
                  <p class="perm-item-resumen">
                    {{
                      permisoDeshabilitadoPorSistema(permiso.clave)
                        ? `${permiso.descripcion} Deshabilitado globalmente en Configuración → Sistema.`
                        : permiso.descripcion
                    }}
                  </p>
                </div>
                <label class="perm-sw">
                  <input
                    v-model="borradorPermisos[permiso.clave]"
                    type="checkbox"
                    class="perm-sw-input"
                    role="switch"
                    :aria-labelledby="`lbl-p-${permiso.clave}`"
                    :disabled="permisoDeshabilitadoPorSistema(permiso.clave)"
                  />
                  <span class="perm-sw-ui" aria-hidden="true" />
                </label>
              </li>
            </ul>
          </section>
        </fieldset>
      </template>

      <p v-else-if="usuariosOrdenados.length === 0" class="pg-vacio--grilla">
        <span class="pg-vacio--grilla-tit">Sin cuentas configurables</span>
        No hay usuarios visibles para tu perfil. Creá cuentas desde Alta y fichas de usuario.
      </p>
    </div>
  </section>
</template>

<style src="../../estilos/panelGestionPermisos.css"></style>

<style scoped>
.perm-select-usuario {
  font-weight: 500;
  min-width: min(100%, 18rem);
}
</style>
