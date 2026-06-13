<script setup lang="ts">
import { useBarraContextoMovil } from '../../composables/useBarraContextoMovil';

const { mostrarBarraContextoMovil, tituloContexto, descripcionContexto, iconoModulo } =
  useBarraContextoMovil();
</script>

<template>
  <header
    v-if="mostrarBarraContextoMovil"
    class="contexto-movil"
    :aria-label="`Sección: ${tituloContexto}`"
  >
    <div class="contexto-movil-enc">
      <component
        :is="iconoModulo"
        v-if="iconoModulo"
        :size="18"
        stroke-width="2"
        class="contexto-movil-ico"
        aria-hidden="true"
      />
      <div class="contexto-movil-textos">
        <h1 class="contexto-movil-tit">{{ tituloContexto }}</h1>
        <p v-if="descripcionContexto" class="contexto-movil-desc">
          {{ descripcionContexto }}
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.contexto-movil {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.contexto-movil-enc {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem 0.5rem;
  min-height: 2.65rem;
}

.contexto-movil-ico {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--color-acento);
}

.contexto-movil-textos {
  min-width: 0;
  flex: 1;
}

.contexto-movil-tit {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--color-texto);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contexto-movil-desc {
  margin: 0.18rem 0 0;
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--color-texto-apagado);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
