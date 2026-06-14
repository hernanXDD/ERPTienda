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
  box-shadow: var(--color-sombra-elevada);
  backdrop-filter: blur(8px);
}

.toast-global--error {
  border-color: var(--color-peligro-borde);
  background: var(--color-peligro-suave);
  color: var(--color-peligro);
}

.toast-global--ok {
  border-color: var(--color-exito-borde);
  background: var(--color-exito-suave);
  color: var(--color-exito);
}

.toast-global--info {
  border-color: var(--color-acento-borde);
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
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
  background: var(--color-hover-neutro);
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.toast-global-x:hover {
  background: var(--color-hover-neutro);
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
