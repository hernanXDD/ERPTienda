<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="layout-ventas">
    <div class="vista-hija">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.layout-ventas {
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
