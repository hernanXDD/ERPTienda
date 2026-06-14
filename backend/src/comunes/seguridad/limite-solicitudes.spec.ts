import { HttpException, HttpStatus } from '@nestjs/common';
import { claveIpSolicitud, limiteSolicitudes } from './limite-solicitudes';

describe('limite-solicitudes', () => {
  describe('claveIpSolicitud', () => {
    it('prioriza la primera IP del encabezado X-Forwarded-For', () => {
      expect(claveIpSolicitud('203.0.113.10, 10.0.0.1', '127.0.0.1', '::1')).toBe('203.0.113.10');
    });

    it('usa ip de express o socket como fallback', () => {
      expect(claveIpSolicitud(undefined, '192.168.1.5', undefined)).toBe('192.168.1.5');
      expect(claveIpSolicitud(undefined, undefined, '10.1.2.3')).toBe('10.1.2.3');
    });

    it('devuelve desconocido si no hay datos', () => {
      expect(claveIpSolicitud(undefined, undefined, undefined)).toBe('desconocido');
    });
  });

  describe('limiteSolicitudes', () => {
    it('permite solicitudes hasta el máximo dentro de la ventana', () => {
      const clave = `test-${Date.now()}-ok`;
      expect(() => limiteSolicitudes.verificar(clave, 2, 60_000)).not.toThrow();
      expect(() => limiteSolicitudes.verificar(clave, 2, 60_000)).not.toThrow();
    });

    it('bloquea cuando se supera el máximo', () => {
      const clave = `test-${Date.now()}-bloqueo`;
      limiteSolicitudes.verificar(clave, 1, 60_000);

      try {
        limiteSolicitudes.verificar(clave, 1, 60_000);
        fail('Debió lanzar HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });
});
