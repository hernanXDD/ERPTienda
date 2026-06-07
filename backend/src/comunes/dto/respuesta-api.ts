export interface RespuestaApi<T> {
  ok: boolean;
  mensaje: string;
  datos: T;
}

export function respuestaOk<T>(datos: T, mensaje = 'Operación exitosa'): RespuestaApi<T> {
  return { ok: true, mensaje, datos };
}

export function respuestaError(mensaje: string): RespuestaApi<null> {
  return { ok: false, mensaje, datos: null };
}
