import { RolUsuario } from '@prisma/client';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { REQUIERE_CONFIGURACION_APP } from '../decoradores/requiere-permiso.decorator';
import { PermisosUsuarioService } from '../permisos/permisos-usuario.service';
import { permisosPorDefectoSegunRol } from '../tipos/permisos-usuario';
import type { UsuarioSesion } from '../tipos/usuario-sesion';
import { PermisosGuard } from './permisos.guard';

describe('PermisosGuard', () => {
  let guard: PermisosGuard;
  let reflector: Reflector;

  const permisosUsuario = {
    tienePermiso: jest.fn(),
    tieneMenuVisible: jest.fn(),
    tieneAlgunoMenuVisible: jest.fn(),
    operadorEsElevado: jest.fn(),
  };

  const operadorBase = (parcial: Pick<UsuarioSesion, 'id' | 'nombreUsuario' | 'rol'>): UsuarioSesion => ({
    ...parcial,
    permisos: permisosPorDefectoSegunRol(
      parcial.rol === 'ADMIN' ? RolUsuario.ADMIN : RolUsuario.EMPLEADO,
    ),
    debeCambiarContrasena: false,
    modoOscuroHabilitado: true,
  });

  const crearContexto = (operador?: UsuarioSesion): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: operador }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PermisosGuard,
        Reflector,
        { provide: PermisosUsuarioService, useValue: permisosUsuario },
      ],
    }).compile();

    guard = modulo.get(PermisosGuard);
    reflector = modulo.get(Reflector);
    jest.clearAllMocks();
  });

  describe('RequiereConfiguracionApp', () => {
    it('permite al administrador principal', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((clave) => {
        if (clave === REQUIERE_CONFIGURACION_APP) return true;
        return undefined;
      });

      const resultado = await guard.canActivate(
        crearContexto(operadorBase({ id: '000001', nombreUsuario: 'admin', rol: 'ADMIN' })),
      );

      expect(resultado).toBe(true);
    });

    it('rechaza operadores que no son el administrador principal', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((clave) => {
        if (clave === REQUIERE_CONFIGURACION_APP) return true;
        return undefined;
      });

      await expect(
        guard.canActivate(
          crearContexto(operadorBase({ id: '000002', nombreUsuario: 'empleado', rol: 'EMPLEADO' })),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza sesión sin operador', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((clave) => {
        if (clave === REQUIERE_CONFIGURACION_APP) return true;
        return undefined;
      });

      await expect(guard.canActivate(crearContexto())).rejects.toThrow(ForbiddenException);
    });
  });
});
