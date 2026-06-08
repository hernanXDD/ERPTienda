import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  menusVisiblesResueltos,
  permisosPorDefectoSegunRol,
  type ClaveMenuPrincipal,
  type PermisosOperativosUsuario,
} from '../tipos/permisos-usuario';

export type ClavePermisoOperativo = Exclude<keyof PermisosOperativosUsuario, 'menusVisibles'>;

@Injectable()
export class PermisosUsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async permisosDeUsuario(idUsuario: string): Promise<PermisosOperativosUsuario> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: idUsuario, fechaEliminacion: null, habilitado: true },
      select: { permisosJson: true, rol: true },
    });
    if (!usuario) {
      throw new ForbiddenException('Usuario no habilitado o inexistente.');
    }

    const almacenados = (usuario.permisosJson ?? {}) as Partial<PermisosOperativosUsuario>;
    const base = permisosPorDefectoSegunRol(usuario.rol);

    return {
      ...base,
      ...almacenados,
      menusVisibles: menusVisiblesResueltos(almacenados.menusVisibles),
    };
  }

  async tienePermiso(idUsuario: string, clave: ClavePermisoOperativo): Promise<boolean> {
    const permisos = await this.permisosDeUsuario(idUsuario);
    return permisos[clave] === true;
  }

  async tieneMenuVisible(idUsuario: string, menu: ClaveMenuPrincipal): Promise<boolean> {
    const permisos = await this.permisosDeUsuario(idUsuario);
    return permisos.menusVisibles[menu] === true;
  }

  async tieneAlgunoMenuVisible(
    idUsuario: string,
    menus: ClaveMenuPrincipal[],
  ): Promise<boolean> {
    if (menus.length === 0) return false;
    const permisos = await this.permisosDeUsuario(idUsuario);
    return menus.some((menu) => permisos.menusVisibles[menu] === true);
  }

  async operadorEsElevado(idUsuario: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: idUsuario, fechaEliminacion: null, habilitado: true },
      select: { rol: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    return usuario.rol === RolUsuario.ADMIN || usuario.rol === RolUsuario.DUENO;
  }
}
