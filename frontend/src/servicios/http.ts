import axios from 'axios';

export const clienteHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const CLAVE_TOKEN_ACCESO = 'erp_token_acceso';

let manejadorRespuesta401: (() => void) | null = null;

/** Registra cierre de sesión ante token inválido o expirado (configurar en main.ts). */
export function registrarManejadorRespuesta401(fn: () => void): void {
  manejadorRespuesta401 = fn;
}

clienteHttp.interceptors.request.use((config) => {
  if (config.url?.includes('/autenticacion/inicio-sesion')) {
    return config;
  }
  const token = sessionStorage.getItem(CLAVE_TOKEN_ACCESO);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clienteHttp.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const esLogin = url.includes('/autenticacion/inicio-sesion');
      const esSesionActual = url.includes('/autenticacion/sesion-actual');
      if (!esLogin && !esSesionActual) {
        manejadorRespuesta401?.();
      }
    }
    return Promise.reject(error);
  },
);
