import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  armarMensajeErrorCargaMaestros,
} from '../stores/inicializacionDatos';
import {
  esErrorDemasiadasSolicitudes,
  mensajeErrorHttp,
  mensajeUsuarioDemasiadasSolicitudes,
} from '../servicios/apiUtil';

describe('apiUtil — demasiadas solicitudes', () => {
  it('detecta error HTTP 429', () => {
    const error = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { mensaje: 'Demasiadas solicitudes' },
    });
    expect(esErrorDemasiadasSolicitudes(error)).toBe(true);
  });

  it('devuelve mensaje amigable para 429 en mensajeErrorHttp', () => {
    const error = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(mensajeErrorHttp(error, 'fallback')).toBe(mensajeUsuarioDemasiadasSolicitudes());
  });
});

describe('armarMensajeErrorCargaMaestros', () => {
  it('prioriza mensaje de rate limit sobre fallos parciales', () => {
    const mensaje = armarMensajeErrorCargaMaestros(['catálogo', 'stock'], true);
    expect(mensaje).toBe(mensajeUsuarioDemasiadasSolicitudes());
  });

  it('lista módulos fallidos cuando no hubo rate limit', () => {
    const mensaje = armarMensajeErrorCargaMaestros(['catálogo', 'stock'], false);
    expect(mensaje).toContain('catálogo');
    expect(mensaje).toContain('stock');
    expect(mensaje).toContain('Reintentar carga');
  });
});
