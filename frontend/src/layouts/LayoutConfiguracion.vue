<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="layout-configuracion">
    <div class="vista-hija">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.layout-configuracion {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 0 auto;
  min-height: auto;
}

.vista-hija {
  min-height: auto;
  flex: 1 0 auto;
}
</style>
