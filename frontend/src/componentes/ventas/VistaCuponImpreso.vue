<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  html: string;
}>();

const contenedorRef = ref<HTMLElement | null>(null);

defineExpose({
  contenedorRef,
});
</script>

<template>
  <div
    v-if="html"
    ref="contenedorRef"
    class="cup-vista-impresa"
    aria-label="Vista previa del cupón"
    v-html="html"
  />
  <p v-else class="cup-vista-cargando" role="status">Generando cupón…</p>
</template>

<style scoped>
.cup-vista-impresa {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  overflow: visible;
  padding: 0.5rem 0;
}

.cup-vista-impresa :deep(.rep-doc--cupon-clasica),
.cup-vista-impresa :deep(.rep-doc--cupon-ticket),
.cup-vista-impresa :deep(.rep-doc--cupon-tarjeta) {
  box-sizing: border-box;
  width: min(26rem, 100%);
  height: auto;
  aspect-ratio: 85.6 / 53.98;
  min-width: unset;
  min-height: unset;
  max-width: min(26rem, 100%);
  max-height: unset;
  margin: 0 auto;
  padding: 0;
  border-radius: 0.75rem;
  overflow: hidden;
  filter: drop-shadow(0 10px 28px rgba(15, 23, 42, 0.22));
}

.cup-vista-impresa :deep(.cup-vale),
.cup-vista-impresa :deep(.cup-gift),
.cup-vista-impresa :deep(.cup-bol) {
  height: 100%;
}

.cup-vista-cargando {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
}
</style>
