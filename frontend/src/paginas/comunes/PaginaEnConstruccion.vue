<script setup lang="ts">
defineProps<{
  titulo: string;
  descripcion?: string;
}>();
</script>

<template>
  <section class="envoltorio" aria-labelledby="titulo-construccion">
    <h1 id="titulo-construccion" class="titulo">{{ titulo }}</h1>
    <p v-if="descripcion" class="texto">{{ descripcion }}</p>
    <p v-else class="texto">Sección en preparación.</p>
  </section>
</template>

<style scoped>
.envoltorio {
  max-width: 36rem;
}

.titulo {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
  font-weight: 600;
}

.texto {
  margin: 0;
  color: var(--color-texto-apagado);
  line-height: 1.5;
}
</style>
