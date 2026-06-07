<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LayoutGrid, ShieldCheck } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { menusVisiblesPorDefecto, menusVisiblesResueltos } from '../../modulos/usuarios/permisosUsuario';
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
import { useSesionStore } from '../../stores/sesion';
import type {
  MenusVisiblesUsuario,
  PermisosOperativosUsuario,
  UsuarioGestion,
} from '../../tipos/usuarioGestion';

const gestionStore = useGestionUsuariosStore();
const sesionStore = useSesionStore();
const router = useRouter();
const route = useRoute();
const { usuarios } = storeToRefs(gestionStore);

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
  puedeAjustarStock: false,
  puedeRegistrarCompras: false,
  puedeGestionarCatalogoProductos: false,
  puedeGestionarFichasDeUsuario: false,
  puedeInhabilitarUsuario: false,
  puedeEliminarUsuario: false,
  puedeBlanquearContrasenaUsuario: false,
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
              <p class="pg-sub">
                Módulos visibles en el menú y permisos operativos de la tienda. Editá y confirmá
                con «Guardar cambios». <strong>Inicio</strong> queda siempre habilitado.
              </p>
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
                  <p class="perm-item-resumen">{{ permiso.descripcion }}</p>
                </div>
                <label class="perm-sw">
                  <input
                    v-model="borradorPermisos[permiso.clave]"
                    type="checkbox"
                    class="perm-sw-input"
                    role="switch"
                    :aria-labelledby="`lbl-p-${permiso.clave}`"
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

<style scoped>
.pg-marco--permisos {
  --pg-reserva-vertical-vista: clamp(17rem, 38dvh, 24rem);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.perm-kpi-estado {
  font-size: 0.82rem;
  letter-spacing: -0.01em;
}

.perm-aviso-dueno {
  margin: 0 clamp(1rem, 3vw, 1.65rem);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(234, 179, 8, 0.35);
  background: rgba(234, 179, 8, 0.08);
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.perm-select-usuario {
  font-weight: 500;
  min-width: min(100%, 18rem);
}

.perm-aviso {
  flex: 1 1 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.perm-aviso--ok {
  color: var(--color-exito);
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.28);
}

.perm-aviso--info {
  color: var(--color-texto-suave);
  background: rgba(124, 140, 240, 0.08);
  border: 1px solid rgba(124, 140, 240, 0.22);
}

.perm-aviso--error {
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.32);
}

.perm-ficha {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem 0.85rem;
  margin: 0.4rem clamp(1rem, 3vw, 1.65rem) 0;
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: linear-gradient(
    155deg,
    rgba(124, 140, 240, 0.07) 0%,
    rgba(15, 23, 42, 0.28) 100%
  );
}

.perm-ficha-nombre {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-texto);
}

.perm-ficha-login {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: var(--color-texto-apagado);
}

.perm-ficha-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.perm-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid var(--color-borde);
  color: var(--color-texto-suave);
  background: rgba(255, 255, 255, 0.04);
}

.perm-chip--rol {
  border-color: rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.12);
  color: var(--color-texto);
}

.perm-chip--habilitado {
  border-color: rgba(74, 222, 128, 0.35);
  color: var(--color-exito);
  background: rgba(74, 222, 128, 0.08);
}

.perm-chip--inhabilitado {
  border-color: rgba(251, 113, 133, 0.35);
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.07);
}

.perm-chip--pendiente {
  border-color: rgba(234, 179, 8, 0.4);
  color: #fbbf24;
  background: rgba(234, 179, 8, 0.1);
}

.perm-chip--edicion {
  border-color: rgba(124, 140, 240, 0.38);
  color: var(--color-acento-hover);
  background: rgba(124, 140, 240, 0.12);
}

.perm-cuerpo {
  border: none;
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.58rem;
  padding: 0.52rem clamp(1rem, 3vw, 1.65rem) 0.72rem;
  overflow-x: hidden;
  overflow-y: auto;
  align-items: stretch;
}

.perm-cuerpo--solo-lectura {
  opacity: 0.94;
}

.perm-cuerpo:disabled .perm-sw-ui {
  cursor: not-allowed;
  opacity: 0.72;
}

@media (max-width: 1023px) {
  .perm-cuerpo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow-y: auto;
  }

  .perm-bloque--menus {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .perm-cuerpo {
    grid-template-columns: 1fr;
  }
}

.perm-bloque {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 10px;
  border: 1px solid rgba(52, 68, 96, 0.48);
  background: rgba(14, 20, 34, 0.78);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03) inset;
  overflow: hidden;
}

.perm-bloque--menus {
  min-height: 0;
}

.perm-bloque--adm {
  border-color: rgba(124, 140, 240, 0.2);
}

.perm-bloque-enc {
  display: flex;
  align-items: center;
  gap: 0.48rem;
  padding: 0.48rem 0.72rem;
  border-bottom: 1px solid rgba(52, 68, 96, 0.38);
  background: rgba(21, 29, 46, 0.38);
}

.perm-bloque-ico {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.72rem;
  height: 1.72rem;
  border-radius: 7px;
  color: var(--color-acento-hover);
  background: rgba(124, 140, 240, 0.1);
  border: 1px solid rgba(124, 140, 240, 0.2);
}

.perm-bloque-tit {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-texto);
  line-height: 1.2;
}

.perm-bloque-badge {
  flex-shrink: 0;
  padding: 0.14rem 0.46rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-acento-hover);
  background: rgba(124, 140, 240, 0.1);
  border: 1px solid rgba(124, 140, 240, 0.24);
}

.perm-malla-modulos {
  list-style: none;
  margin: 0;
  padding: 0.42rem 0.5rem 0.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.32rem;
  align-content: start;
}

.perm-lista-acciones {
  list-style: none;
  margin: 0;
  padding: 0.42rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.perm-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: flex-start;
  gap: 0.48rem;
  padding: 0.42rem 0.52rem;
  border-radius: 9px;
  border: 1px solid rgba(42, 58, 84, 0.48);
  background: rgba(7, 11, 20, 0.38);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.perm-item--accion {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.perm-item--menu .perm-sw {
  margin-top: 0.12rem;
}

.perm-item:hover {
  border-color: rgba(124, 140, 240, 0.22);
  background: rgba(124, 140, 240, 0.04);
}

.perm-item--activo {
  border-color: rgba(124, 140, 240, 0.28);
  background: rgba(124, 140, 240, 0.06);
}

.perm-item--elevada.perm-item--activo {
  border-color: rgba(234, 179, 8, 0.28);
  background: rgba(234, 179, 8, 0.05);
}

.perm-item--critica.perm-item--activo {
  border-color: rgba(251, 113, 133, 0.3);
  background: rgba(251, 113, 133, 0.05);
}

.perm-item-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.72rem;
  height: 1.72rem;
  margin-top: 0.06rem;
  border-radius: 7px;
  color: var(--color-texto-suave);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(42, 58, 84, 0.55);
}

.perm-item--activo .perm-item-ico {
  color: var(--color-acento-hover);
  border-color: rgba(124, 140, 240, 0.24);
  background: rgba(124, 140, 240, 0.1);
}

.perm-item-info {
  min-width: 0;
}

.perm-item-cab {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.28rem 0.42rem;
  min-width: 0;
}

.perm-item-tit {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-texto);
  line-height: 1.28;
}

.perm-item-resumen {
  margin: 0.14rem 0 0;
  font-size: 0.71rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.perm-item-nivel {
  display: inline-flex;
  align-items: center;
  padding: 0.08rem 0.34rem;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid var(--color-borde);
  color: var(--color-texto-apagado);
  background: rgba(255, 255, 255, 0.03);
}

.perm-item-nivel--elevada {
  border-color: rgba(234, 179, 8, 0.32);
  color: #fbbf24;
  background: rgba(234, 179, 8, 0.07);
}

.perm-item-nivel--critica {
  border-color: rgba(251, 113, 133, 0.32);
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.07);
}

.perm-sw {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.perm-sw-input {
  position: absolute;
  inset: 0;
  width: 2.2rem;
  height: 1.2rem;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.perm-sw-ui {
  position: relative;
  display: block;
  width: 2.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-borde);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.22);
}

.perm-sw-ui::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0.14rem;
  width: 0.86rem;
  height: 0.86rem;
  border-radius: 50%;
  background: var(--color-texto-apagado);
  transform: translate(0, -50%);
  transition:
    transform 0.18s ease,
    background 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.perm-sw-input:focus-visible + .perm-sw-ui {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.perm-sw-input:checked + .perm-sw-ui {
  background: rgba(124, 140, 240, 0.38);
  border-color: rgba(124, 140, 240, 0.58);
}

.perm-sw-input:checked + .perm-sw-ui::after {
  transform: translate(0.96rem, -50%);
  background: var(--color-acento-hover);
}

@media (max-width: 520px) {
  .perm-malla-modulos {
    grid-template-columns: 1fr;
  }
}
</style>
