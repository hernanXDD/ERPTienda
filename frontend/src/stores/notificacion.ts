import { defineStore } from 'pinia';
import { ref } from 'vue';

export type TipoNotificacion = 'error' | 'ok' | 'info';

export const useNotificacionStore = defineStore('notificacion', () => {
  const mensaje = ref<string | null>(null);
  const tipo = ref<TipoNotificacion>('info');
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  function mostrar(
    texto: string,
    tipoNotificacion: TipoNotificacion = 'error',
    duracionMs = 4800,
  ): void {
    if (temporizador) clearTimeout(temporizador);
    mensaje.value = texto;
    tipo.value = tipoNotificacion;
    temporizador = setTimeout(() => {
      mensaje.value = null;
      temporizador = undefined;
    }, duracionMs);
  }

  function ocultar(): void {
    if (temporizador) clearTimeout(temporizador);
    mensaje.value = null;
    temporizador = undefined;
  }

  return { mensaje, tipo, mostrar, ocultar };
});
