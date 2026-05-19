import type { UsuarioSesion } from './sesion';

/**
 * Respuestas alineadas con lo que devolverá el backend Nest.
 * Los nombres de campos conviven con convenciones HTTP comunes para tokens.
 */
export interface RespuestaInicioSesion {
  accessToken: string;
  usuario: UsuarioSesion;
}

export interface RespuestaSesionActual {
  usuario: UsuarioSesion;
}
