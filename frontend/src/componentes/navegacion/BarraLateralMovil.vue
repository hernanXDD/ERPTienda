<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { onKeyStroke } from '@vueuse/core';
import { onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useMenuLateralMovil } from '../../composables/useMenuLateralMovil';
import { useGestoDeslizarMenuLateralMovil } from '../../composables/useGestoDeslizarMenuLateralMovil';
import { useEsMovil } from '../../composables/useEsMovil';
import { elementoMenuCoincideRuta } from '../../modulos/nucleo/elementosNavegacion';
import { useElementosMenuFiltrados } from '../../composables/useElementosMenuFiltrados';

const esMovil = useEsMovil();
const rutaActiva = useRoute();
const { elementosMenuFiltrados } = useElementosMenuFiltrados();
const { menuLateralMovilAbierto, alternarMenuLateralMovil, cerrarMenuLateralMovil, abrirMenuLateralMovil } =
  useMenuLateralMovil();

const {
  panelRef,
  posicionPanelPx,
  opacidadFondo,
  arrastrando,
  posicionPestanaPx,
  sincronizarPosicionConEstado,
} = useGestoDeslizarMenuLateralMovil({
  esMovil,
  menuAbierto: menuLateralMovilAbierto,
  abrirMenu: abrirMenuLateralMovil,
  cerrarMenu: cerrarMenuLateralMovil,
});

/** Ruta del menú padre cuyos submenús están visibles (solo uno a la vez). */
const grupoExpandido = ref<string | null>(null);

function grupoEstaExpandido(nombreRuta: string): boolean {
  return grupoExpandido.value === nombreRuta;
}

function alternarGrupo(nombreRuta: string): void {
  grupoExpandido.value = grupoExpandido.value === nombreRuta ? null : nombreRuta;
}

function colapsarGrupos(): void {
  grupoExpandido.value = null;
}

function sincronizarGrupoConRutaActiva(): void {
  const padreActivo = elementosMenuFiltrados.value.find(
    (elemento) =>
      Boolean(elemento.subelementos?.length) &&
      elementoMenuCoincideRuta(rutaActiva.name, elemento),
  );
  grupoExpandido.value = padreActivo?.nombreRuta ?? null;
}

watch(
  () => rutaActiva.name,
  () => {
    cerrarMenuLateralMovil();
  },
);

watch(panelRef, () => {
  sincronizarPosicionConEstado();
});

watch(menuLateralMovilAbierto, (abierto) => {
  if (!esMovil.value) return;
  document.body.style.overflow = abierto ? 'hidden' : '';
  if (abierto) {
    sincronizarGrupoConRutaActiva();
    sincronizarPosicionConEstado();
  } else {
    colapsarGrupos();
    sincronizarPosicionConEstado();
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
});

onKeyStroke('Escape', () => {
  if (menuLateralMovilAbierto.value) cerrarMenuLateralMovil();
});
</script>

<template>
  <Teleport v-if="esMovil" to="body">
    <button
      type="button"
      class="menu-movil-pestana"
      :class="{ 'menu-movil-pestana--sin-transicion': arrastrando }"
      :style="{ left: `${posicionPestanaPx}px` }"
      :aria-expanded="menuLateralMovilAbierto"
      aria-controls="menu-lateral-movil"
      :aria-label="menuLateralMovilAbierto ? 'Cerrar menú' : 'Abrir menú'"
      @click="alternarMenuLateralMovil"
    >
      <ChevronRight v-if="!menuLateralMovilAbierto" :size="20" stroke-width="2.25" aria-hidden="true" />
      <ChevronLeft v-else :size="20" stroke-width="2.25" aria-hidden="true" />
    </button>

    <button
      v-show="opacidadFondo > 0"
      type="button"
      class="menu-movil-fondo"
      :class="{ 'menu-movil-fondo--sin-transicion': arrastrando }"
      :style="{ opacity: opacidadFondo }"
      aria-label="Cerrar menú"
      @click="cerrarMenuLateralMovil"
    />

    <aside
      id="menu-lateral-movil"
      ref="panelRef"
      class="menu-movil-panel"
      :class="{ 'menu-movil-panel--sin-transicion': arrastrando }"
      :style="{ transform: `translateX(${posicionPanelPx}px)` }"
      aria-label="Navegación principal"
      :aria-hidden="!menuLateralMovilAbierto && !arrastrando"
    >
      <header class="menu-movil-cab">
        <p class="menu-movil-cab-tit">Menú</p>
      </header>

      <nav class="menu-movil-nav" aria-label="Secciones">
        <template v-for="elemento in elementosMenuFiltrados" :key="elemento.nombreRuta">
          <div v-if="elemento.subelementos?.length" class="menu-movil-grupo">
            <button
              type="button"
              class="menu-movil-grupo-tit"
              :class="{
                activo: elementoMenuCoincideRuta(rutaActiva.name, elemento),
                expandido: grupoEstaExpandido(elemento.nombreRuta),
              }"
              :aria-expanded="grupoEstaExpandido(elemento.nombreRuta)"
              @click="alternarGrupo(elemento.nombreRuta)"
            >
              <component
                :is="elemento.icono"
                :size="20"
                stroke-width="1.75"
                aria-hidden="true"
                class="menu-movil-ico"
              />
              <span class="menu-movil-grupo-etiq">{{ elemento.etiqueta }}</span>
              <ChevronDown
                :size="18"
                stroke-width="2"
                class="menu-movil-grupo-flecha"
                aria-hidden="true"
              />
            </button>
            <div
              v-show="grupoEstaExpandido(elemento.nombreRuta)"
              class="menu-movil-subs"
            >
              <RouterLink
                v-for="sub in elemento.subelementos"
                :key="sub.nombreRuta"
                :to="{ name: sub.nombreRuta }"
                class="menu-movil-enlace menu-movil-enlace--sub"
                :class="{ activo: rutaActiva.name === sub.nombreRuta }"
              >
                {{ sub.etiqueta }}
              </RouterLink>
            </div>
          </div>

          <RouterLink
            v-else
            :to="{ name: elemento.nombreRuta }"
            class="menu-movil-enlace"
            :class="{ activo: rutaActiva.name === elemento.nombreRuta }"
            @click="colapsarGrupos"
          >
            <component
              :is="elemento.icono"
              :size="20"
              stroke-width="1.75"
              aria-hidden="true"
              class="menu-movil-ico"
            />
            <span class="menu-movil-enlace-etiq">{{ elemento.etiqueta }}</span>
          </RouterLink>
        </template>
      </nav>

      <footer class="menu-movil-pie" aria-hidden="true">
        <span class="menu-movil-marca">ERPTienda</span>
      </footer>
    </aside>
  </Teleport>
</template>

<style scoped>
.menu-movil-pestana {
  position: fixed;
  left: 0;
  top: 50%;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.65rem;
  height: 3.25rem;
  padding: 0;
  border: 1px solid var(--color-borde);
  border-left: none;
  border-radius: 0 10px 10px 0;
  background: var(--color-fondo-elevado);
  color: var(--color-acento-hover);
  box-shadow: var(--color-sombra-elevada);
  transform: translateY(-50%);
  transition: left 0.28s ease;
  -webkit-tap-highlight-color: transparent;
}

.menu-movil-pestana--sin-transicion {
  transition: none;
}

.menu-movil-fondo {
  position: fixed;
  inset: 0;
  z-index: 58;
  border: none;
  padding: 0;
  background: var(--color-scrim);
  backdrop-filter: blur(2px);
  cursor: pointer;
  transition: opacity 0.25s ease;
}

.menu-movil-fondo--sin-transicion {
  transition: none;
}

.menu-movil-panel {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 59;
  display: flex;
  flex-direction: column;
  width: min(85vw, 17.5rem);
  height: 100dvh;
  max-height: 100dvh;
  border-right: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: var(--color-sombra-elevada);
  transform: translateX(-100%);
  transition: transform 0.28s ease;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.menu-movil-panel--sin-transicion {
  transition: none;
}

.menu-movil-cab {
  flex-shrink: 0;
  padding: 0.85rem 1rem 0.65rem;
  border-bottom: 1px solid var(--color-borde);
}

.menu-movil-cab-tit {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-texto-apagado);
}

.menu-movil-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.55rem 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.menu-movil-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.15rem;
}

.menu-movil-grupo-tit {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radio-control);
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  text-align: left;
  color: var(--color-texto-suave);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.menu-movil-grupo-etiq {
  flex: 1;
  min-width: 0;
}

.menu-movil-grupo-flecha {
  flex-shrink: 0;
  opacity: 0.65;
  transition: transform 0.2s ease;
}

.menu-movil-grupo-tit.expandido .menu-movil-grupo-flecha {
  transform: rotate(180deg);
  opacity: 0.9;
}

.menu-movil-subs {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  padding: 0.1rem 0 0.2rem;
}

.menu-movil-enlace {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.5rem;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radio-control);
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--color-texto-suave);
  border: 1px solid transparent;
}

.menu-movil-enlace-etiq {
  flex: 1;
  min-width: 0;
  font-size: inherit;
  font-weight: inherit;
  line-height: 1.25;
  color: inherit;
}

.menu-movil-enlace--sub {
  min-height: 2.35rem;
  padding-left: 2.35rem;
  font-size: 0.86rem;
  font-weight: 500;
}

.menu-movil-enlace.activo,
.menu-movil-grupo-tit.activo {
  background: var(--color-acento-suave);
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
}

.menu-movil-ico {
  flex-shrink: 0;
}

.menu-movil-pie {
  flex-shrink: 0;
  padding: 0.65rem 1rem 0.85rem;
  border-top: 1px solid var(--color-borde);
  text-align: center;
}

.menu-movil-marca {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-texto-apagado);
  opacity: 0.45;
}
</style>
