<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { menusVisiblesPorDefecto, menusVisiblesResueltos } from '../../datos/semillaUsuariosGestion';
import { etiquetaRolUsuario } from '../../datos/etiquetasRolUsuario';
import {
  claveMenuRequeridaPorRuta,
  primeraRutaNombreSegunMenus,
  ETIQUETA_MENU_PRINCIPAL,
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

let temporizadorRetroalimentacion: ReturnType<typeof globalThis.setTimeout> | undefined;

function mostrarRetroalimentacionBreve(texto: string) {
  mensajeExito.value = texto;
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

/** Si editás tu propia cuenta y cerrás el menú de la pantalla actual, te lleva a una ruta permitida. */
function redirigirSiSesionPerdioAccesoARutaActual() {
  const idSesion = sesionStore.usuario?.id;
  if (!idSesion || usuarioSeleccionado.value?.id !== idSesion) return;

  const actualizado = gestionStore.obtenerPorId(idSesion);
  if (!actualizado) return;

  const menus = menusVisiblesResueltos(actualizado.permisos.menusVisibles);
  const clave = claveMenuRequeridaPorRuta(route.name);
  if (clave && !menus[clave]) {
    const destino = primeraRutaNombreSegunMenus(menus);
    if (destino !== route.name) {
      void router.replace({ name: destino });
    }
  }
}

/**
 * Los switches aplican al instante en el simulador: el menú y el guard de rutas leen siempre el store.
 */
function alCambiarSwitchPermisos() {
  const usuario = usuarioSeleccionado.value;
  if (!usuario) return;

  const siguiente: PermisosOperativosUsuario = {
    ...borradorPermisos.value,
    menusVisibles: menusVisiblesResueltos(borradorPermisos.value.menusVisibles),
  };

  if (igualALosGuardados(siguiente, usuario.permisos)) return;

  const guardadoOk = gestionStore.actualizarPermisosUsuario(usuario.id, siguiente);
  if (!guardadoOk) {
    sincronizarBorradorDesdeUsuarioEnStore();
    mostrarRetroalimentacionBreve('No se pudo aplicar el cambio.');
    return;
  }

  redirigirSiSesionPerdioAccesoARutaActual();
  mostrarRetroalimentacionBreve('Cambio aplicado.');
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
const mensajeExito = ref('');

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
    if (!usuario) return;
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

function guardarCambiosPermisos() {
  const usuario = usuarioSeleccionado.value;
  if (!usuario) return;

  const siguiente: PermisosOperativosUsuario = {
    ...borradorPermisos.value,
    menusVisibles: menusVisiblesResueltos(borradorPermisos.value.menusVisibles),
  };

  if (igualALosGuardados(siguiente, usuario.permisos)) {
    mensajeExito.value = 'No hay cambios que guardar.';
    return;
  }

  const guardadoOk = gestionStore.actualizarPermisosUsuario(usuario.id, siguiente);
  if (!guardadoOk) {
    sincronizarBorradorDesdeUsuarioEnStore();
    mensajeExito.value =
      'No se pudieron guardar los permisos. Verificá que el usuario siga existiendo y que tengas autorización.';
    return;
  }

  redirigirSiSesionPerdioAccesoARutaActual();
  mensajeExito.value =
    'Permisos guardados. Los switches ya aplican los cambios en tiempo real; este mensaje confirma una sincronización manual.';
}
</script>

<template>
  <section class="pu" aria-labelledby="tit-permisos-usuarios">
    <header class="pu-barra">
      <div class="pu-barra-texto">
        <h1 id="tit-permisos-usuarios" class="pu-tit-principal">Permisos por cuenta</h1>
        <p class="pu-lead">
          Módulos visibles en el menú y permisos operativos.
          <strong>Inicio</strong>
          queda siempre habilitado.
        </p>
      </div>
      <div class="pu-barra-select">
        <label class="pu-etq" for="select-usuario-permisos">Usuario</label>
        <select
          id="select-usuario-permisos"
          v-model="idUsuarioSeleccionado"
          class="pu-select pu-select--principal"
          :disabled="usuariosOrdenados.length === 0"
        >
          <option v-for="u in usuariosOrdenados" :key="u.id" :value="u.id">
            {{ u.apellido }}, {{ u.nombre }}
          </option>
        </select>
      </div>
    </header>

    <p v-if="sesionEsDueño" class="pu-banner-dueno">
      Con perfil
      <strong>Dueño</strong>
      no se listan cuentas
      <strong>Administrador</strong>
      .
    </p>

    <template v-if="usuarioSeleccionado">
      <div class="pu-meta-fila" aria-live="polite">
        <span class="pu-chip pu-chip--rol">{{ etiquetaRolUsuario(usuarioSeleccionado.rol) }}</span>
        <span
          class="pu-chip"
          :class="
            usuarioSeleccionado.habilitado ? 'pu-chip--habilitado' : 'pu-chip--inhabilitado'
          "
        >
          {{
            usuarioSeleccionado.habilitado
              ? 'Sesión permitida si la credencial es válida'
              : 'Cuenta inhabilitada para iniciar sesión'
          }}
        </span>
      </div>

      <div class="pu-area-trabajo" @change="alCambiarSwitchPermisos">
        <fieldset class="pu-panel" aria-labelledby="leyenda-menus-visibles">
          <legend id="leyenda-menus-visibles" class="pu-panel-tit">Menús visibles</legend>
          <p id="hint-menus" class="pu-panel-hint">
            Al mover un interruptor se guarda de inmediato: el menú y las rutas respetan el valor guardado para esa
            cuenta.
          </p>
          <div class="pu-malla-menu" role="group" aria-describedby="hint-menus">
            <div
              v-for="clave in ORDEN_CLAVES_MENU_PRINCIPAL"
              :key="clave"
              class="pu-item-sw"
            >
              <span class="pu-item-etiq" :id="`lbl-menu-${clave}`">{{ ETIQUETA_MENU_PRINCIPAL[clave] }}</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.menusVisibles[clave]"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  :aria-labelledby="`lbl-menu-${clave}`"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset class="pu-panel" aria-labelledby="leyenda-permisos-op">
          <legend id="leyenda-permisos-op" class="pu-panel-tit">Operación tienda</legend>
          <div class="pu-lista-sw" role="group">
            <div class="pu-item-sw">
              <span id="lbl-p-ajuste-stock" class="pu-item-etiq">Inventario y ajustes de stock</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeAjustarStock"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-ajuste-stock"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
            <div class="pu-item-sw">
              <span id="lbl-p-compras" class="pu-item-etiq">Registro y circuito de compras</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeRegistrarCompras"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-compras"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
            <div class="pu-item-sw">
              <span id="lbl-p-catalogo" class="pu-item-etiq">Catálogo de productos</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeGestionarCatalogoProductos"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-catalogo"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset class="pu-panel" aria-labelledby="leyenda-permisos-adm-usuarios">
          <legend id="leyenda-permisos-adm-usuarios" class="pu-panel-tit">Administración de usuarios</legend>
          <div class="pu-lista-sw" role="group">
            <div class="pu-item-sw">
              <span id="lbl-p-fichas" class="pu-item-etiq">Fichas (login, rol, contraseña)</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeGestionarFichasDeUsuario"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-fichas"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
            <div class="pu-item-sw">
              <span id="lbl-p-inhab" class="pu-item-etiq">Inhabilitar / rehabilitar cuentas</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeInhabilitarUsuario"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-inhab"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
            <div class="pu-item-sw">
              <span id="lbl-p-blanq" class="pu-item-etiq">
                Blanquear contraseña (solo la propia; Administrador y Dueño pueden otras cuentas)
              </span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeBlanquearContrasenaUsuario"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-blanq"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
            <div class="pu-item-sw">
              <span id="lbl-p-del" class="pu-item-etiq">Eliminar usuarios (demo)</span>
              <label class="pu-sw pu-sw--compacto">
                <input
                  v-model="borradorPermisos.puedeEliminarUsuario"
                  type="checkbox"
                  class="pu-sw-input"
                  role="switch"
                  aria-labelledby="lbl-p-del"
                />
                <span class="pu-sw-ui" aria-hidden="true" />
              </label>
            </div>
          </div>
        </fieldset>
      </div>

      <footer class="pu-pie">
        <button type="button" class="pu-btn-pri" @click="guardarCambiosPermisos">Guardar cambios</button>
        <p v-if="mensajeExito" class="pu-feedback" role="status">{{ mensajeExito }}</p>
      </footer>
    </template>

    <p v-else-if="usuariosOrdenados.length === 0" class="pu-vacio">No hay usuarios para configurar.</p>
  </section>
</template>

<style scoped>
/* Altura acotada al viewport en escritorio para evitar scroll vertical en esta vista */
.pu {
  --pu-offset-vista: 13.35rem;
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  height: calc(100dvh - var(--pu-offset-vista));
  max-height: calc(100dvh - var(--pu-offset-vista));
  overflow: hidden;
}

@media (max-width: 767px) {
  .pu {
    --pu-offset-vista: 15.25rem;
    height: auto;
    max-height: none;
    overflow: visible;
  }
}

.pu-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  padding: 0.65rem 0.85rem;
  border-radius: calc(var(--radio-control) + 2px);
  border: 1px solid var(--color-borde);
  background: linear-gradient(165deg, rgba(19, 26, 40, 0.55) 0%, rgba(26, 33, 50, 0.35) 100%);
  box-shadow: var(--sombra-suave);
  flex-shrink: 0;
}

.pu-barra-texto {
  flex: 1 1 14rem;
  min-width: 0;
}

.pu-tit-principal {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--color-texto);
}

.pu-lead {
  margin: 0.28rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  max-width: 36rem;
}

.pu-barra-select {
  flex: 1 1 16rem;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.pu-etq {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.pu-select {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.875rem;
}

.pu-select--principal {
  padding: 0.52rem 0.62rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-color: rgba(124, 140, 240, 0.4);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18);
}

.pu-banner-dueno {
  margin: 0;
  padding: 0.45rem 0.65rem;
  border-radius: var(--radio-control);
  border: 1px solid rgba(234, 179, 8, 0.35);
  background: rgba(234, 179, 8, 0.07);
  font-size: 0.76rem;
  line-height: 1.4;
  color: var(--color-texto-suave);
  flex-shrink: 0;
}

.pu-meta-fila {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  flex-shrink: 0;
}

.pu-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid var(--color-borde);
  color: var(--color-texto-suave);
  background: rgba(255, 255, 255, 0.04);
}

.pu-chip--rol {
  border-color: rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.1);
  color: var(--color-texto);
}

.pu-chip--habilitado {
  border-color: rgba(74, 222, 128, 0.35);
  color: var(--color-exito);
  background: rgba(74, 222, 128, 0.08);
}

.pu-chip--inhabilitado {
  border-color: rgba(251, 113, 133, 0.35);
  color: var(--color-peligro);
  background: rgba(251, 113, 133, 0.07);
}

.pu-area-trabajo {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  align-items: stretch;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .pu-area-trabajo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow-y: auto;
  }

  .pu-panel:last-of-type {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .pu-area-trabajo {
    grid-template-columns: 1fr;
    overflow-y: visible;
  }

  .pu-panel:last-of-type {
    grid-column: auto;
  }
}

.pu-panel {
  margin: 0;
  padding: 0.55rem 0.65rem 0.6rem;
  border-radius: var(--radio-control);
  border: 1px solid rgba(42, 58, 84, 0.65);
  background: var(--color-fondo-elevado);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
}

.pu-panel-tit {
  float: unset;
  width: auto;
  padding: 0;
  margin: 0 0 0.15rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.pu-panel-hint {
  margin: 0 0 0.25rem;
  font-size: 0.68rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
}

.pu-malla-menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.28rem 0.45rem;
  flex: 1;
  min-height: 0;
  align-content: start;
}

@media (max-width: 400px) {
  .pu-malla-menu {
    grid-template-columns: 1fr;
  }
}

.pu-lista-sw {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  flex: 1;
  min-height: 0;
}

.pu-item-sw {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  padding: 0.28rem 0.4rem;
  border-radius: 8px;
  background: rgba(7, 11, 20, 0.35);
  border: 1px solid rgba(42, 58, 84, 0.45);
}

.pu-item-etiq {
  font-size: 0.78rem;
  line-height: 1.25;
  color: var(--color-texto-suave);
  flex: 1;
  min-width: 0;
}

.pu-sw {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.pu-sw-input {
  position: absolute;
  inset: 0;
  width: 2.5rem;
  height: 1.45rem;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.pu-sw-ui {
  position: relative;
  display: block;
  width: 2.5rem;
  height: 1.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-borde);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
}

.pu-sw-ui::after {
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

.pu-sw-input:focus-visible + .pu-sw-ui {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

.pu-sw-input:checked + .pu-sw-ui {
  background: rgba(124, 140, 240, 0.35);
  border-color: rgba(124, 140, 240, 0.55);
}

.pu-sw-input:checked + .pu-sw-ui::after {
  transform: translate(1.05rem, -50%);
  background: var(--color-acento-hover);
}

.pu-sw.pu-sw--compacto .pu-sw-input {
  width: 2.05rem;
  height: 1.15rem;
}

.pu-sw.pu-sw--compacto .pu-sw-ui {
  width: 2.05rem;
  height: 1.15rem;
}

.pu-sw.pu-sw--compacto .pu-sw-ui::after {
  width: 0.82rem;
  height: 0.82rem;
  left: 0.15rem;
}

.pu-sw.pu-sw--compacto .pu-sw-input:checked + .pu-sw-ui::after {
  transform: translate(0.82rem, -50%);
}

.pu-pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem 1rem;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(42, 58, 84, 0.45);
  flex-shrink: 0;
}

.pu-btn-pri {
  padding: 0.48rem 1rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento));
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(91, 110, 230, 0.28);
}

.pu-btn-pri:hover {
  filter: brightness(1.06);
}

.pu-feedback {
  margin: 0;
  flex: 1 1 12rem;
  font-size: 0.76rem;
  line-height: 1.35;
  color: var(--color-texto-suave);
  text-align: right;
}

@media (max-width: 540px) {
  .pu-feedback {
    text-align: left;
    flex-basis: 100%;
  }
}

.pu-vacio {
  margin: 0;
  padding: 1rem;
  font-size: 0.88rem;
  color: var(--color-texto-apagado);
  border: 1px dashed var(--color-borde);
  border-radius: var(--radio-control);
}
</style>
