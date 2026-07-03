import axios, { type InternalAxiosRequestConfig } from 'axios';

export const clienteHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const CLAVE_TOKEN_ACCESO = 'erp_token_acceso';

const MAX_REINTENTOS_429 = 2;
const ESPERA_BASE_MS = 1_000;
const ESPERA_MAXIMA_MS = 5_000;

interface ConfiguracionConReintento429 extends InternalAxiosRequestConfig {
  reintento429?: number;
}

let manejadorRespuesta401: (() => void) | null = null;

/** Registra cierre de sesión ante token inválido o expirado (configurar en main.ts). */
export function registrarManejadorRespuesta401(fn: () => void): void {
  manejadorRespuesta401 = fn;
}

function esperaReintento429(intento: number, encabezadoRetryAfter: string | undefined): number {
  const desdeEncabezado = encabezadoRetryAfter ? Number(encabezadoRetryAfter) * 1_000 : Number.NaN;
  if (Number.isFinite(desdeEncabezado) && desdeEncabezado > 0) {
    return Math.min(desdeEncabezado, ESPERA_MAXIMA_MS);
  }
  return Math.min(ESPERA_BASE_MS * intento, ESPERA_MAXIMA_MS);
}

function pausar(ms: number): Promise<void> {
  return new Promise((resolver) => {
    setTimeout(resolver, ms);
  });
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
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const configuracion = error.config as ConfiguracionConReintento429 | undefined;
    const esDemasiadasSolicitudes = error.response?.status === 429;

    if (esDemasiadasSolicitudes && configuracion) {
      const intentoActual = configuracion.reintento429 ?? 0;
      if (intentoActual < MAX_REINTENTOS_429) {
        configuracion.reintento429 = intentoActual + 1;
        const esperaMs = esperaReintento429(
          configuracion.reintento429,
          error.response?.headers?.['retry-after'],
        );
        await pausar(esperaMs);
        return clienteHttp.request(configuracion);
      }
    }

    if (error.response?.status === 401) {
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
