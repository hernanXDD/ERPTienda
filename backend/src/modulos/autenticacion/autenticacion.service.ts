import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PermisosUsuarioService } from '../../comunes/permisos/permisos-usuario.service';
import { rolDesdeBaseDeDatos } from '../../comunes/tipos/rol-usuario-api';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { PrismaService } from '../../prisma/prisma.service';
import { InicioSesionDto } from './dto/inicio-sesion.dto';
import type { PayloadJwt } from './estrategias/jwt.strategy';

export interface RespuestaInicioSesion {
  accessToken: string;
  usuario: UsuarioSesion;
}

export interface RespuestaSesionActual {
  usuario: UsuarioSesion;
}

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly permisosUsuario: PermisosUsuarioService,
  ) {}

  async iniciarSesion(datos: InicioSesionDto): Promise<RespuestaInicioSesion> {
    const nombreUsuario = datos.nombreUsuario.trim();

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        nombreUsuario: { equals: nombreUsuario, mode: 'insensitive' },
        fechaEliminacion: null,
      },
    });

    if (!usuario || !usuario.habilitado) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    if (usuario.contrasenaEstaBlanqueada) {
      throw new UnauthorizedException(
        'La contraseña fue blanqueada. Solicitá una nueva credencial al administrador.',
      );
    }

    const contrasenaValida = await bcrypt.compare(datos.contrasena, usuario.contrasenaHash);
    if (!contrasenaValida) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const usuarioSesion = await this.construirUsuarioSesion(usuario.id, usuario.nombreUsuario, usuario.rol);

    const payload: PayloadJwt = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuarioSesion.rol,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, usuario: usuarioSesion };
  }

  async obtenerSesionActual(usuarioSesion: UsuarioSesion): Promise<RespuestaSesionActual> {
    const permisos = await this.permisosUsuario.permisosDeUsuario(usuarioSesion.id);
    return {
      usuario: {
        ...usuarioSesion,
        permisos,
      },
    };
  }

  /** JWT stateless: el cliente descarta el token; no hay estado en servidor. */
  cerrarSesion(): { ok: true; mensaje: string } {
    return { ok: true, mensaje: 'Sesión cerrada en el cliente.' };
  }

  private async construirUsuarioSesion(
    id: string,
    nombreUsuario: string,
    rolDb: Parameters<typeof rolDesdeBaseDeDatos>[0],
  ): Promise<UsuarioSesion> {
    const permisos = await this.permisosUsuario.permisosDeUsuario(id);
    return {
      id,
      nombreUsuario,
      rol: rolDesdeBaseDeDatos(rolDb),
      permisos,
    };
  }
}
