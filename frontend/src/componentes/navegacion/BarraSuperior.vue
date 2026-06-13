<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ChevronDown, LogOut, User } from 'lucide-vue-next';
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useLogoNegocio } from '../../composables/useLogoNegocio';
import { inicialesNombreNegocio } from '../../modulos/negocio/inicialesNombreNegocio';
import { useNegocioStore } from '../../stores/negocio';
import { useSesionStore } from '../../stores/sesion';

const sesion = useSesionStore();
const negocioStore = useNegocioStore();
const { usuario } = storeToRefs(sesion);
const { nombreNegocio } = storeToRefs(negocioStore);
const router = useRouter();

const menuAbierto = ref(false);
/** Ref clásico: evita problemas de enlace con useTemplateRef en algunos entornos. */
const envoltorioMenu = ref<HTMLElement | null>(null);

const inicialesNegocio = computed(() => inicialesNombreNegocio(nombreNegocio.value));
const { urlLogo, cargarLogo } = useLogoNegocio();

onMounted(async () => {
  await negocioStore.asegurarCargado();
  await cargarLogo();
});

watch(
  nombreNegocio,
  (nombre) => {
    document.title = nombre;
  },
  { immediate: true },
);

onClickOutside(envoltorioMenu, () => {
  menuAbierto.value = false;
});

onKeyStroke('Escape', () => {
  if (menuAbierto.value) menuAbierto.value = false;
});

function alternarMenu() {
  menuAbierto.value = !menuAbierto.value;
}

async function manejarCerrarSesion() {
  menuAbierto.value = false;
  await sesion.cerrarSesion();
  await router.push({ name: 'inicio-sesion' });
}
</script>

<template>
  <header class="barra" role="banner" dir="ltr">
    <RouterLink :to="{ name: 'inicio' }" class="marca" :title="`Ir al inicio · ${nombreNegocio}`">
      <img
        v-if="urlLogo"
        :src="urlLogo"
        :alt="`Logo de ${nombreNegocio}`"
        class="marca-logo img-logo-transparente"
      />
      <span v-else class="marca-escudo" aria-hidden="true">{{ inicialesNegocio }}</span>
      <span class="sr-only">{{ nombreNegocio }}</span>
    </RouterLink>

    <div v-if="usuario" ref="envoltorioMenu" class="envoltorio-menu">
      <button
        type="button"
        class="boton-usuario"
        :class="{ activo: menuAbierto }"
        :aria-expanded="menuAbierto"
        aria-haspopup="menu"
        aria-controls="menu-cuenta-usuario"
        @click="alternarMenu"
      >
        <span class="indicador-avatar" aria-hidden="true">
          <User :size="18" stroke-width="1.75" />
        </span>
        <span class="bloque-usuario-corto">
          <span class="nombre-corto">{{ usuario.nombreUsuario }}</span>
          <span class="rol-corto">{{ usuario.rol }}</span>
        </span>
        <ChevronDown
          class="icono-chevron"
          :size="16"
          stroke-width="2"
          aria-hidden="true"
          :class="{ abierto: menuAbierto }"
        />
        <span class="sr-only">Menú de cuenta: {{ usuario.nombreUsuario }}</span>
      </button>

      <div
        v-show="menuAbierto"
        id="menu-cuenta-usuario"
        role="menu"
        class="menu-desplegable"
        aria-label="Cuenta"
      >
        <div class="bloque-usuario" role="none">
          <p class="nombre">{{ usuario.nombreUsuario }}</p>
          <p class="rol">{{ usuario.rol }}</p>
        </div>
        <div class="separador" role="separator" />
        <button
          type="button"
          role="menuitem"
          class="item-cerrar-sesion"
          @click="manejarCerrarSesion"
        >
          <LogOut :size="18" stroke-width="1.75" aria-hidden="true" class="icono-item" />
          Cerrar sesión
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.barra {
  position: relative;
  z-index: 50;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 3.5rem;
  padding: 0 0.85rem 0 1rem;
  gap: 0.85rem;
  background: linear-gradient(180deg, #0a101c 0%, var(--color-fondo-cabecera) 100%);
  border-bottom: 1px solid var(--color-borde);
  box-shadow: var(--sombra-suave);
  overflow: visible;
}

.marca {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0.15rem 0.25rem 0.15rem 0;
  border-radius: var(--radio-control);
  text-decoration: none;
  color: inherit;
  transition: opacity 0.15s ease;
}

.marca:hover {
  opacity: 0.92;
}

.marca-logo {
  flex-shrink: 0;
  height: 2.85rem;
  width: auto;
  max-width: min(11rem, 42vw);
}

.marca-escudo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.85rem;
  height: 2.85rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(145deg, var(--color-acento-hover), var(--color-acento-intenso));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 4px 14px rgba(91, 110, 230, 0.28);
}

.envoltorio-menu {
  position: relative;
  flex-shrink: 0;
  margin-inline-start: auto;
  overflow: visible;
}

.boton-usuario {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 8rem;
  max-width: min(16rem, 52vw);
  height: 2.65rem;
  padding: 0 0.6rem 0 0.35rem;
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  background: rgba(21, 29, 46, 0.85);
  color: var(--color-texto-suave);
}

.boton-usuario:hover,
.boton-usuario.activo {
  border-color: var(--color-acento-borde);
  color: var(--color-texto);
  background: var(--color-fondo-elevado);
  box-shadow: 0 0 0 1px var(--color-acento-suave);
}

.indicador-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
}

.bloque-usuario-corto {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.02rem;
  flex: 1;
  min-width: 0;
}

.nombre-corto {
  width: 100%;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-texto);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rol-corto {
  width: 100%;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icono-chevron {
  flex-shrink: 0;
  opacity: 0.75;
  transition: transform 0.15s ease;
}

.icono-chevron.abierto {
  transform: rotate(180deg);
}

.menu-desplegable {
  position: absolute;
  right: 0;
  top: calc(100% + 0.45rem);
  z-index: 200;
  min-width: 12.5rem;
  padding: 0.35rem 0;
  background: var(--color-fondo-elevado);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  box-shadow: var(--sombra-suave);
}

.bloque-usuario {
  padding: 0.65rem 0.85rem 0.5rem;
}

.nombre {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-texto);
  word-break: break-word;
}

.rol {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--color-texto-apagado);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.separador {
  height: 1px;
  margin: 0.25rem 0;
  background: var(--color-borde);
  border: none;
}

.item-cerrar-sesion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: none;
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.875rem;
  text-align: left;
}

.item-cerrar-sesion:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-texto);
}

.icono-item {
  flex-shrink: 0;
  opacity: 0.9;
}

@media (max-width: 767px) {
  .barra {
    min-height: 3.15rem;
    padding: 0 calc(0.65rem + env(safe-area-inset-right, 0px)) 0
      calc(0.75rem + env(safe-area-inset-left, 0px));
  }

  .marca-logo {
    height: 2.35rem;
    max-width: min(8.5rem, 38vw);
  }

  .marca-escudo {
    width: 2.35rem;
    height: 2.35rem;
    font-size: 0.78rem;
  }

  .bloque-usuario-corto {
    display: none;
  }

  .boton-usuario {
    min-width: 2.75rem;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    justify-content: center;
  }

  .icono-chevron {
    display: none;
  }

  .menu-desplegable {
    right: 0;
    left: auto;
    min-width: min(14rem, calc(100vw - 1.25rem));
  }
}

@media (max-width: 420px) {
  .marca-logo {
    height: 2.25rem;
    max-width: min(7.5rem, 42vw);
  }

  .marca-escudo {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 0.75rem;
  }
}
</style>
