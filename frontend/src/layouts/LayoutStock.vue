<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="layout-stock">
    <div class="vista-hija">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.layout-stock {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.vista-hija {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
