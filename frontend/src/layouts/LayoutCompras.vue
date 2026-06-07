<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="layout-compras">
    <div class="vista-hija">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.layout-compras {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
}

.vista-hija {
  min-height: 0;
  flex: 1;
}
</style>
