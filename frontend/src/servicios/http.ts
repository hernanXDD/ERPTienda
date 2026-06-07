import axios from 'axios';

export const clienteHttp = axios.create({
  baseURL: '/api',
  timeout: 15_000,
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
