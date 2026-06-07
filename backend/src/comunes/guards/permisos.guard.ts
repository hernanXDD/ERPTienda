import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  CLAVE_MENU_REQUERIDO,
  CLAVE_PERMISO_REQUERIDO,
  REQUIERE_ROL_ELEVADO,
} from '../decoradores/requiere-permiso.decorator';
import { PermisosUsuarioService } from '../permisos/permisos-usuario.service';
import type { ClaveMenuPrincipal } from '../tipos/permisos-usuario';
import type { UsuarioSesion } from '../tipos/usuario-sesion';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisosUsuario: PermisosUsuarioService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const permiso = this.reflector.getAllAndOverride<string | undefined>(CLAVE_PERMISO_REQUERIDO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    const menu = this.reflector.getAllAndOverride<ClaveMenuPrincipal | undefined>(
      CLAVE_MENU_REQUERIDO,
      [contexto.getHandler(), contexto.getClass()],
    );
    const rolElevado = this.reflector.getAllAndOverride<boolean>(REQUIERE_ROL_ELEVADO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!permiso && !menu && !rolElevado) return true;

    const solicitud = contexto.switchToHttp().getRequest<Request & { user?: UsuarioSesion }>();
    const operador = solicitud.user;
    if (!operador?.id) {
      throw new ForbiddenException('Sesión inválida.');
    }

    if (rolElevado) {
      const esElevado = await this.permisosUsuario.operadorEsElevado(operador.id);
      if (!esElevado) {
        throw new ForbiddenException('Esta operación requiere perfil Administrador o Dueño.');
      }
    }

    if (permiso) {
      const autorizado = await this.permisosUsuario.tienePermiso(
        operador.id,
        permiso as Parameters<PermisosUsuarioService['tienePermiso']>[1],
      );
      if (!autorizado) {
        throw new ForbiddenException('No tenés permiso para realizar esta operación.');
      }
    }

    if (menu) {
      const visible = await this.permisosUsuario.tieneMenuVisible(operador.id, menu);
      if (!visible) {
        throw new ForbiddenException('No tenés acceso a este módulo.');
      }
    }

    return true;
  }
}
