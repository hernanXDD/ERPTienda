<script setup lang="ts">
import { computed, ref } from 'vue';
import { Pin, PinOff } from 'lucide-vue-next';
import { RouterLink, useRoute } from 'vue-router';
import { useBarraLateral } from '../../composables/useBarraLateral';
import { elementoMenuCoincideRuta, type ElementoMenuPrincipal } from '../../modulos/nucleo/elementosNavegacion';
import { useElementosMenuFiltrados } from '../../composables/useElementosMenuFiltrados';

const rutaActiva = useRoute();
const { elementosMenuFiltrados } = useElementosMenuFiltrados();
const { barraLateralFijada, alternarFijacionBarraLateral } = useBarraLateral();

const expandidaPorHover = ref(false);

const barraExpandida = computed(() => barraLateralFijada.value || expandidaPorHover.value);

function claveElemento(idx: number, conSub: boolean) {
  return conSub ? `grupo-${idx}` : `item-${idx}`;
}

function enlacePadreActivo(nombreRuta: typeof rutaActiva.name, elemento: ElementoMenuPrincipal) {
  if (barraExpandida.value) {
    return nombreRuta === elemento.nombreRuta;
  }
  return elementoMenuCoincideRuta(nombreRuta ?? undefined, elemento);
}

function alEntrarMouse() {
  if (!barraLateralFijada.value) {
    expandidaPorHover.value = true;
  }
}

function alSalirMouse() {
  expandidaPorHover.value = false;
}
</script>

<template>
  <div
    class="lateral-envoltorio"
    @mouseenter="alEntrarMouse"
    @mouseleave="alSalirMouse"
  >
    <aside
      class="lateral"
      :class="{ 'lateral--colapsada': !barraExpandida }"
      id="navegacion-principal-lateral"
      aria-label="Navegación principal"
    >
      <header class="lateral-cabecera">
        <p class="lateral-etiq">Navegación</p>
        <button
          type="button"
          class="boton-fijar"
          :class="{ 'boton-fijar--activo': barraLateralFijada }"
          :aria-pressed="barraLateralFijada"
          aria-controls="menu-lateral-secciones"
          :aria-label="barraLateralFijada ? 'Desfijar menú lateral' : 'Fijar menú lateral expandido'"
          @click="alternarFijacionBarraLateral"
        >
          <Pin v-if="barraLateralFijada" :size="16" stroke-width="2" aria-hidden="true" />
          <PinOff v-else :size="16" stroke-width="2" aria-hidden="true" />
        </button>
      </header>

      <nav id="menu-lateral-secciones" class="nav" aria-label="Secciones">
        <template v-for="(elemento, idx) in elementosMenuFiltrados" :key="claveElemento(idx, Boolean(elemento.subelementos))">
          <template v-if="elemento.subelementos?.length">
            <div
              v-if="barraExpandida && elementoMenuCoincideRuta(rutaActiva.name, elemento)"
              class="grupo"
            >
              <div class="grupo-cabecera">
                <component
                  :is="elemento.icono"
                  :size="20"
                  stroke-width="1.75"
                  aria-hidden="true"
                  class="icono-grupo"
                />
                <span>{{ elemento.etiqueta }}</span>
              </div>
              <RouterLink
                v-for="sub in elemento.subelementos"
                :key="sub.nombreRuta"
                :to="{ name: sub.nombreRuta }"
                class="enlace enlace-sub"
                :class="{ activo: rutaActiva.name === sub.nombreRuta }"
              >
                {{ sub.etiqueta }}
              </RouterLink>
            </div>

            <RouterLink
              v-else
              :to="{ name: elemento.nombreRuta }"
              class="enlace"
              :class="{ activo: enlacePadreActivo(rutaActiva.name, elemento) }"
              :title="barraExpandida ? undefined : elemento.etiqueta"
            >
              <component :is="elemento.icono" :size="20" stroke-width="1.75" aria-hidden="true" class="icono" />
              <span class="enlace-texto">{{ elemento.etiqueta }}</span>
            </RouterLink>
          </template>

          <RouterLink
            v-else
            :to="{ name: elemento.nombreRuta }"
            class="enlace"
            :class="{ activo: rutaActiva.name === elemento.nombreRuta }"
            :title="barraExpandida ? undefined : elemento.etiqueta"
          >
            <component :is="elemento.icono" :size="20" stroke-width="1.75" aria-hidden="true" class="icono" />
            <span class="enlace-texto">{{ elemento.etiqueta }}</span>
          </RouterLink>
        </template>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
.lateral-envoltorio {
  position: relative;
  flex-shrink: 0;
  align-self: center;
  width: var(--ancho-barra-lateral-colapsada);
  height: var(--alto-barra-lateral);
  max-height: var(--alto-barra-lateral);
}

.lateral {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: var(--ancho-barra-lateral);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-elevado);
  transition:
    width 0.2s ease,
    box-shadow 0.2s ease;
  overflow: hidden;
}

.lateral--colapsada {
  width: var(--ancho-barra-lateral-colapsada);
}

.lateral:not(.lateral--colapsada) {
  z-index: 55;
  box-shadow: var(--sombra-suave);
}

.lateral-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.55rem 0.45rem 0.35rem;
  border-bottom: 1px solid var(--color-borde);
}

.lateral--colapsada .lateral-cabecera {
  flex-direction: column;
  align-items: center;
  padding-inline: 0.3rem;
}

.lateral-etiq {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-texto-apagado);
  white-space: nowrap;
}

.lateral--colapsada .lateral-etiq {
  font-size: 0.58rem;
  letter-spacing: 0.05em;
  text-align: center;
  line-height: 1.15;
}

.boton-fijar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: var(--color-fondo);
  color: var(--color-texto-apagado);
}

.boton-fijar--activo {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
}

.boton-fijar:hover {
  border-color: var(--color-acento-borde);
  color: var(--color-texto);
}

.nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0.45rem 0.45rem 0.65rem;
  gap: 0.35rem;
  overflow-y: auto;
}

.lateral--colapsada .nav {
  padding-inline: 0.35rem;
}

.grupo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.25rem;
}

.grupo-cabecera {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem 0.25rem;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.icono-grupo {
  flex-shrink: 0;
  opacity: 0.85;
}

.enlace {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radio-control);
  font-size: 0.9rem;
  color: var(--color-texto-suave);
  border: 1px solid transparent;
}

.lateral--colapsada .enlace {
  justify-content: center;
  padding-inline: 0.4rem;
}

.lateral--colapsada .enlace-texto {
  display: none;
}

.enlace-sub {
  padding-left: 1.5rem;
  font-size: 0.86rem;
}

.enlace:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-texto);
}

.enlace.activo {
  background: var(--color-acento-suave);
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
}

.icono {
  flex-shrink: 0;
}
</style>
