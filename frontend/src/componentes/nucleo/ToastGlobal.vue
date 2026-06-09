<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useNotificacionStore } from '../../stores/notificacion';

const notificacion = useNotificacionStore();
const { mensaje, tipo } = storeToRefs(notificacion);
</script>

<template>
  <Transition name="toast-global">
    <div
      v-if="mensaje"
      class="toast-global"
      :class="`toast-global--${tipo}`"
      role="status"
      aria-live="polite"
    >
      <p class="toast-global-txt">{{ mensaje }}</p>
      <button type="button" class="toast-global-x" aria-label="Cerrar aviso" @click="notificacion.ocultar()">
        ×
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast-global {
  position: fixed;
  z-index: 1200;
  left: 50%;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  width: min(36rem, calc(100vw - 1.5rem));
  padding: 0.72rem 0.85rem;
  border-radius: 12px;
  border: 1px solid transparent;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

.toast-global--error {
  border-color: rgba(251, 113, 133, 0.45);
  background: rgba(76, 18, 28, 0.94);
  color: #ffe4e6;
}

.toast-global--ok {
  border-color: rgba(74, 222, 128, 0.42);
  background: rgba(12, 48, 32, 0.94);
  color: #dcfce7;
}

.toast-global--info {
  border-color: rgba(124, 140, 240, 0.42);
  background: rgba(18, 24, 48, 0.94);
  color: #e0e7ff;
}

.toast-global-txt {
  margin: 0;
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.45;
}

.toast-global-x {
  flex-shrink: 0;
  width: 1.65rem;
  height: 1.65rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.toast-global-x:hover {
  background: rgba(255, 255, 255, 0.16);
}

.toast-global-enter-active,
.toast-global-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-global-enter-from,
.toast-global-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.75rem);
}
</style>
