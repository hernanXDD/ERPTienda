import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { manejarPeticionSimulada } from './simulador/simuladorApi';

const adaptadorHttpReal = axios.getAdapter(['xhr', 'http']) as AxiosAdapter;

function usarSimulador(): boolean {
  return import.meta.env.VITE_USAR_SIMULADOR !== 'false';
}

async function adaptadorDoble(config: InternalAxiosRequestConfig) {
  if (usarSimulador()) {
    return manejarPeticionSimulada(config);
  }
  return adaptadorHttpReal(config);
}

export const clienteHttp = axios.create({
  baseURL: '/api',
  adapter: adaptadorDoble,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const CLAVE_TOKEN_ACCESO = 'erp_token_acceso';

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
