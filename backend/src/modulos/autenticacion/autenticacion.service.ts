import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { rolDesdeBaseDeDatos } from '../../comunes/tipos/rol-usuario-api';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
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

    const usuarioSesion: UsuarioSesion = {
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: rolDesdeBaseDeDatos(usuario.rol),
    };

    const payload: PayloadJwt = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuarioSesion.rol,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, usuario: usuarioSesion };
  }

  obtenerSesionActual(usuarioSesion: UsuarioSesion): RespuestaSesionActual {
    return { usuario: usuarioSesion };
  }

  /** JWT stateless: el cliente descarta el token; no hay estado en servidor. */
  cerrarSesion(): { ok: true; mensaje: string } {
    return { ok: true, mensaje: 'Sesión cerrada en el cliente.' };
  }
}
