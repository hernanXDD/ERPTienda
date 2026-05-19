<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ChevronDown, LogOut, User } from 'lucide-vue-next';
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSesionStore } from '../../stores/sesion';

const sesion = useSesionStore();
const { usuario } = storeToRefs(sesion);
const router = useRouter();

const menuAbierto = ref(false);
/** Ref clásico: evita problemas de enlace con useTemplateRef en algunos entornos. */
const envoltorioMenu = ref<HTMLElement | null>(null);

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
    <div class="marca">
      <span class="logo" aria-hidden="true" />
      <span class="titulo-app">ERP Tienda</span>
    </div>

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
        <span class="nombre-corto" aria-hidden="true">{{ usuario.nombreUsuario }}</span>
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
  min-height: 3.25rem;
  padding: 0 0.75rem 0 0.9rem;
  gap: 0.75rem;
  background: var(--color-fondo-cabecera);
  border-bottom: 1px solid var(--color-borde);
  box-shadow: var(--sombra-suave);
  overflow: visible;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.logo {
  display: inline-block;
  width: 0.55rem;
  height: 1.35rem;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento-intenso));
}

.titulo-app {
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.02em;
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
  gap: 0.45rem;
  min-width: 7.5rem;
  max-width: min(14rem, 52vw);
  height: 2.6rem;
  padding: 0 0.55rem 0 0.35rem;
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto-suave);
}

.boton-usuario:hover,
.boton-usuario.activo {
  border-color: var(--color-acento-borde);
  color: var(--color-texto);
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

.nombre-corto {
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-texto);
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

@media (max-width: 420px) {
  .nombre-corto {
    display: none;
  }
}
</style>
