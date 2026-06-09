import { useNotificacionStore, type TipoNotificacion } from '../stores/notificacion';

export function notificar(texto: string, tipo: TipoNotificacion = 'error', duracionMs?: number): void {
  useNotificacionStore().mostrar(texto, tipo, duracionMs);
}

export function notificarError(texto: string, duracionMs?: number): void {
  notificar(texto, 'error', duracionMs);
}

export function notificarOk(texto: string, duracionMs?: number): void {
  notificar(texto, 'ok', duracionMs);
}
