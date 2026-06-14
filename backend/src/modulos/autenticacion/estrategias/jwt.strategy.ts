import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { filtroNoBorrado } from '../../../comunes/utilidades/borrado-logico';
import { PermisosUsuarioService } from '../../../comunes/permisos/permisos-usuario.service';
import { rolDesdeBaseDeDatos } from '../../../comunes/tipos/rol-usuario-api';
import type { UsuarioSesion } from '../../../comunes/tipos/usuario-sesion';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PayloadJwt {
  sub: string;
  nombreUsuario: string;
  rol: UsuarioSesion['rol'];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configuracion: ConfigService,
    private readonly prisma: PrismaService,
    private readonly permisosUsuario: PermisosUsuarioService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuracion.getOrThrow<string>('JWT_SECRETO'),
    });
  }

  async validate(payload: PayloadJwt): Promise<UsuarioSesion> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: payload.sub,
        ...filtroNoBorrado,
        habilitado: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Sesión inválida o usuario inhabilitado.');
    }

    if (usuario.contrasenaEstaBlanqueada) {
      throw new UnauthorizedException(
        'La contraseña fue blanqueada. Solicitá una nueva credencial al administrador.',
      );
    }

    const permisos = await this.permisosUsuario.permisosDeUsuario(usuario.id);

    return {
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: rolDesdeBaseDeDatos(usuario.rol),
      permisos,
      debeCambiarContrasena: usuario.debeCambiarContrasena,
      modoOscuroHabilitado: usuario.modoOscuroHabilitado,
    };
  }
}
