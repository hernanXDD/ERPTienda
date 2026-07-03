import axios from 'axios';

export function esErrorDemasiadasSolicitudes(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429;
}

export function mensajeUsuarioDemasiadasSolicitudes(): string {
  return 'Demasiadas solicitudes al servidor. Esperá unos segundos y usá «Reintentar carga».';
}

export function mensajeErrorHttp(error: unknown, fallback: string): string {
  if (esErrorDemasiadasSolicitudes(error)) {
    return mensajeUsuarioDemasiadasSolicitudes();
  }
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
