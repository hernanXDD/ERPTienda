import axios from 'axios';

export function mensajeErrorHttp(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('mensaje' in data && typeof data.mensaje === 'string') {
        return normalizarMensajeError(data.mensaje);
      }
      if ('message' in data) {
        const mensaje = data.message;
        if (typeof mensaje === 'string') return normalizarMensajeError(mensaje);
        if (Array.isArray(mensaje)) return normalizarMensajeError(mensaje.join(' '));
      }
    }
    return normalizarMensajeError(error.message || fallback);
  }
  if (error instanceof Error) return normalizarMensajeError(error.message);
  return fallback;
}

function normalizarMensajeError(mensaje: string): string {
  return mensaje.replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
}
