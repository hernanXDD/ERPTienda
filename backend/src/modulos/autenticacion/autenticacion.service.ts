import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { RONDAS_BCRYPT } from '../../comunes/seguridad/bcrypt.config';
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
        ...filtroNoBorrado,
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

    const usuarioSesion = await this.construirUsuarioSesion(
      usuario.id,
      usuario.nombreUsuario,
      usuario.rol,
      usuario.debeCambiarContrasena,
    );

    const payload: PayloadJwt = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuarioSesion.rol,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, usuario: usuarioSesion };
  }

  async obtenerSesionActual(usuarioSesion: UsuarioSesion): Promise<RespuestaSesionActual> {
    const registro = await this.prisma.usuario.findFirst({
      where: { id: usuarioSesion.id, ...filtroNoBorrado, habilitado: true },
    });
    if (!registro) {
      throw new UnauthorizedException('Sesión inválida o usuario inhabilitado.');
    }

    const permisos = await this.permisosUsuario.permisosDeUsuario(usuarioSesion.id);
    return {
      usuario: {
        id: registro.id,
        nombreUsuario: registro.nombreUsuario,
        rol: rolDesdeBaseDeDatos(registro.rol),
        permisos,
        debeCambiarContrasena: registro.debeCambiarContrasena,
      },
    };
  }

  async cambiarContrasenaInicial(
    usuarioSesion: UsuarioSesion,
    contrasenaNueva: string,
  ): Promise<RespuestaSesionActual> {
    const registro = await this.prisma.usuario.findFirst({
      where: { id: usuarioSesion.id, ...filtroNoBorrado, habilitado: true },
    });

    if (!registro) {
      throw new UnauthorizedException('Sesión inválida o usuario inhabilitado.');
    }

    if (!registro.debeCambiarContrasena) {
      throw new BadRequestException('No es necesario cambiar la contraseña en este momento.');
    }

    const contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_BCRYPT);
    const actualizado = await this.prisma.usuario.update({
      where: { id: registro.id },
      data: {
        contrasenaHash,
        debeCambiarContrasena: false,
        contrasenaEstaBlanqueada: false,
      },
    });

    const permisos = await this.permisosUsuario.permisosDeUsuario(actualizado.id);

    return {
      usuario: {
        id: actualizado.id,
        nombreUsuario: actualizado.nombreUsuario,
        rol: rolDesdeBaseDeDatos(actualizado.rol),
        permisos,
        debeCambiarContrasena: false,
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
    debeCambiarContrasena: boolean,
  ): Promise<UsuarioSesion> {
    const permisos = await this.permisosUsuario.permisosDeUsuario(id);
    return {
      id,
      nombreUsuario,
      rol: rolDesdeBaseDeDatos(rolDb),
      permisos,
      debeCambiarContrasena,
    };
  }
}
