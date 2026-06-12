<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';

const ruta = useRoute();
</script>

<template>
  <div class="layout-reportes">
    <div class="vista-hija">
      <RouterView :key="ruta.name" />
    </div>
  </div>
</template>

<style scoped>
.layout-reportes {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 0 auto;
  min-height: auto;
  width: 100%;
}

.vista-hija {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  min-height: auto;
  width: 100%;
}
</style>
