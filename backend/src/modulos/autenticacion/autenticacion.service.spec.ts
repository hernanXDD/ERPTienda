import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PermisosUsuarioService } from '../../comunes/permisos/permisos-usuario.service';
import { permisosPorDefectoSegunRol } from '../../comunes/tipos/permisos-usuario';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { PrismaService } from '../../prisma/prisma.service';
import { AutenticacionService } from './autenticacion.service';

describe('AutenticacionService', () => {
  let servicio: AutenticacionService;

  const prisma = {
    usuario: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const permisosUsuario = {
    permisosDeUsuario: jest.fn(),
  };

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacionService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: PermisosUsuarioService, useValue: permisosUsuario },
      ],
    }).compile();

    servicio = modulo.get(AutenticacionService);
    jest.clearAllMocks();
    permisosUsuario.permisosDeUsuario.mockResolvedValue(permisosPorDefectoSegunRol(RolUsuario.ADMIN));
    jwtService.signAsync.mockResolvedValue('token-jwt-prueba');
  });

  describe('iniciarSesion', () => {
    it('devuelve token y usuario con credenciales válidas', async () => {
      const hash = await bcrypt.hash('Admin123', 4);
      prisma.usuario.findFirst.mockResolvedValue({
        id: '000001',
        nombreUsuario: 'admin',
        rol: RolUsuario.ADMIN,
        habilitado: true,
        contrasenaEstaBlanqueada: false,
        contrasenaHash: hash,
        debeCambiarContrasena: false,
        modoOscuroHabilitado: true,
      });

      const resultado = await servicio.iniciarSesion({
        nombreUsuario: ' admin ',
        contrasena: 'Admin123',
      });

      expect(resultado.accessToken).toBe('token-jwt-prueba');
      expect(resultado.usuario.nombreUsuario).toBe('admin');
      expect(resultado.usuario.modoOscuroHabilitado).toBe(true);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: '000001',
        nombreUsuario: 'admin',
        rol: 'ADMIN',
      });
    });

    it('rechaza usuario inexistente o inhabilitado', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        servicio.iniciarSesion({ nombreUsuario: 'nadie', contrasena: 'Admin123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rechaza contraseña blanqueada', async () => {
      prisma.usuario.findFirst.mockResolvedValue({
        id: '000002',
        nombreUsuario: 'operador',
        rol: RolUsuario.EMPLEADO,
        habilitado: true,
        contrasenaEstaBlanqueada: true,
        contrasenaHash: 'hash',
        debeCambiarContrasena: true,
        modoOscuroHabilitado: false,
      });

      await expect(
        servicio.iniciarSesion({ nombreUsuario: 'operador', contrasena: 'Admin123' }),
      ).rejects.toThrow(/blanqueada/);
    });

    it('rechaza contraseña incorrecta', async () => {
      const hash = await bcrypt.hash('Admin123', 4);
      prisma.usuario.findFirst.mockResolvedValue({
        id: '000001',
        nombreUsuario: 'admin',
        rol: RolUsuario.ADMIN,
        habilitado: true,
        contrasenaEstaBlanqueada: false,
        contrasenaHash: hash,
        debeCambiarContrasena: false,
        modoOscuroHabilitado: false,
      });

      await expect(
        servicio.iniciarSesion({ nombreUsuario: 'admin', contrasena: 'OtraClave1' }),
      ).rejects.toThrow(/incorrectos/);
    });
  });

  describe('obtenerSesionActual', () => {
    it('refresca permisos del usuario activo', async () => {
      prisma.usuario.findFirst.mockResolvedValue({
        id: '000001',
        nombreUsuario: 'admin',
        rol: RolUsuario.ADMIN,
        debeCambiarContrasena: false,
        modoOscuroHabilitado: false,
      });

      const sesion: UsuarioSesion = {
        id: '000001',
        nombreUsuario: 'admin',
        rol: 'ADMIN',
        permisos: permisosPorDefectoSegunRol(RolUsuario.EMPLEADO),
        debeCambiarContrasena: false,
        modoOscuroHabilitado: false,
      };

      const resultado = await servicio.obtenerSesionActual(sesion);

      expect(resultado.usuario.rol).toBe('ADMIN');
      expect(permisosUsuario.permisosDeUsuario).toHaveBeenCalledWith('000001');
    });
  });

  describe('cambiarContrasenaInicial', () => {
    it('rechaza si no corresponde cambio obligatorio', async () => {
      prisma.usuario.findFirst.mockResolvedValue({
        id: '000001',
        nombreUsuario: 'admin',
        rol: RolUsuario.ADMIN,
        debeCambiarContrasena: false,
        modoOscuroHabilitado: false,
      });

      await expect(
        servicio.cambiarContrasenaInicial(
          {
            id: '000001',
            nombreUsuario: 'admin',
            rol: 'ADMIN',
            permisos: permisosPorDefectoSegunRol(RolUsuario.ADMIN),
            debeCambiarContrasena: false,
            modoOscuroHabilitado: false,
          },
          'NuevaClave1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cerrarSesion', () => {
    it('responde ok sin estado en servidor', () => {
      expect(servicio.cerrarSesion()).toEqual({
        ok: true,
        mensaje: 'Sesión cerrada en el cliente.',
      });
    });
  });
});
