<script setup lang="ts">
import PaginaNuevaVenta from './PaginaNuevaVenta.vue';
</script>

<template>
  <div class="centro-ventas">
    <PaginaNuevaVenta embebido-en-pagina />
  </div>
</template>

<style scoped>
.centro-ventas {
  flex: 1;
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.centro-ventas > :deep(.ev) {
  flex: 1;
  min-height: 0;
}
</style>
