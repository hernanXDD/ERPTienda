import axios, { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { clasificarErrorCuponEscaneo, mensajeErrorCupon, mensajeErrorDevolucion } from './mensajesErrorPostventa';

function errorApi(mensaje: string): AxiosError {
  return new AxiosError(
    'Error',
    AxiosError.ERR_BAD_REQUEST,
    undefined,
    undefined,
    {
      status: 400,
      data: { mensaje },
      headers: {},
      statusText: 'Bad Request',
      config: { headers: new axios.AxiosHeaders() },
    },
  );
}

describe('mensajesErrorPostventa', () => {
  it('traduce cupón vencido al escanear', () => {
    const resultado = clasificarErrorCuponEscaneo(
      errorApi('Este cupón venció y ya no puede utilizarse en caja.'),
      'fallback',
    );
    expect(resultado.tipo).toBe('vencido');
    expect(resultado.mensaje).toContain('venció');
  });

  it('traduce devolución fuera de plazo', () => {
    const mensaje = mensajeErrorDevolucion(
      errorApi('Esta venta ya no admite devoluciones: superó el plazo de 15 días.'),
      'registrar',
    );
    expect(mensaje).toContain('plazo');
  });

  it('traduce línea que no corresponde a la venta', () => {
    const mensaje = mensajeErrorDevolucion(
      errorApi('Una de las prendas seleccionadas no corresponde a la venta indicada.'),
      'registrar',
    );
    expect(mensaje).toBe('Una de las prendas seleccionadas no corresponde a esta venta.');
  });

  it('usa fallback claro si el error no es reconocible', () => {
    const mensaje = mensajeErrorCupon(new Error('fallo desconocido'), 'crear');
    expect(mensaje).toBe('fallo desconocido');
  });
});
