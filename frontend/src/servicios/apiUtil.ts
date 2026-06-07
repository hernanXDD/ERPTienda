import axios from 'axios';

export function mensajeErrorHttp(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('mensaje' in data && typeof data.mensaje === 'string') {
        return data.mensaje;
      }
      if ('message' in data) {
        const mensaje = data.message;
        if (typeof mensaje === 'string') return mensaje;
        if (Array.isArray(mensaje)) return mensaje.join('. ');
      }
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
