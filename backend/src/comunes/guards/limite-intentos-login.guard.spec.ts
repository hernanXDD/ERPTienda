import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LimiteIntentosLoginGuard } from './limite-intentos-login.guard';

describe('LimiteIntentosLoginGuard', () => {
  let guard: LimiteIntentosLoginGuard;

  const configuracion = {
    get: jest.fn((clave: string, defaultValue?: string) => {
      if (clave === 'RATE_LIMIT_LOGIN_MAX') return '2';
      if (clave === 'RATE_LIMIT_LOGIN_IP_MAX') return '3';
      return defaultValue;
    }),
  };

  const crearContexto = (body: unknown, ip = '10.0.0.5'): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          body,
          headers: {},
          ip,
          socket: { remoteAddress: ip },
        }),
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        LimiteIntentosLoginGuard,
        { provide: ConfigService, useValue: configuracion },
      ],
    }).compile();

    guard = modulo.get(LimiteIntentosLoginGuard);
  });

  it('limita por usuario sin bloquear a otros en la misma IP (NAT móvil)', () => {
    const cuerpo = { nombreUsuario: 'admin', contrasena: 'x' };

    expect(() => guard.canActivate(crearContexto(cuerpo, '100.64.0.1'))).not.toThrow();
    expect(() => guard.canActivate(crearContexto(cuerpo, '100.64.0.1'))).not.toThrow();
    expect(() => guard.canActivate(crearContexto(cuerpo, '100.64.0.1'))).toThrow();

    expect(() =>
      guard.canActivate(
        crearContexto({ nombreUsuario: 'empleado', contrasena: 'x' }, '100.64.0.1'),
      ),
    ).not.toThrow();
  });

  it('limita por IP cuando hay muchos usuarios distintos', () => {
    expect(() =>
      guard.canActivate(crearContexto({ nombreUsuario: 'u1', contrasena: 'x' }, '203.0.113.9')),
    ).not.toThrow();
    expect(() =>
      guard.canActivate(crearContexto({ nombreUsuario: 'u2', contrasena: 'x' }, '203.0.113.9')),
    ).not.toThrow();
    expect(() =>
      guard.canActivate(crearContexto({ nombreUsuario: 'u3', contrasena: 'x' }, '203.0.113.9')),
    ).not.toThrow();
    expect(() =>
      guard.canActivate(crearContexto({ nombreUsuario: 'u4', contrasena: 'x' }, '203.0.113.9')),
    ).toThrow();
  });
});
