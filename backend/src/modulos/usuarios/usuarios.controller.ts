import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import {
  RequierePermiso,
  RequiereRolElevado,
} from '../../comunes/decoradores/requiere-permiso.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { ActualizarPermisosUsuarioDto } from './dto/actualizar-permisos-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { HabilitacionUsuarioDto } from './dto/habilitacion-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async listar() {
    const datos = await this.usuariosService.listar();
    return respuestaOk(datos, 'Usuarios obtenidos correctamente.');
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    const usuario = await this.usuariosService.obtenerPorId(id);
    return respuestaOk(usuario, 'Usuario obtenido correctamente.');
  }

  @Post()
  @RequierePermiso('puedeGestionarFichasDeUsuario')
  async crear(@Body() datos: CrearUsuarioDto, @UsuarioSesionActual() operador: UsuarioSesion) {
    const usuario = await this.usuariosService.crear(datos, operador);
    return respuestaOk(usuario, 'Usuario creado correctamente.');
  }

  @Patch(':id')
  @RequierePermiso('puedeGestionarFichasDeUsuario')
  async actualizar(
    @Param('id') id: string,
    @Body() datos: ActualizarUsuarioDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const usuario = await this.usuariosService.actualizar(id, datos, operador);
    return respuestaOk(usuario, 'Usuario actualizado correctamente.');
  }

  @Patch(':id/permisos')
  @RequiereRolElevado()
  async actualizarPermisos(
    @Param('id') id: string,
    @Body() permisos: ActualizarPermisosUsuarioDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const usuario = await this.usuariosService.actualizarPermisos(id, permisos, operador);
    return respuestaOk(usuario, 'Permisos actualizados correctamente.');
  }

  @Patch(':id/habilitado')
  @RequierePermiso('puedeInhabilitarUsuario')
  async establecerHabilitacion(
    @Param('id') id: string,
    @Body() datos: HabilitacionUsuarioDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const usuario = await this.usuariosService.establecerHabilitacion(id, datos.habilitado, operador);
    return respuestaOk(usuario, 'Estado del usuario actualizado correctamente.');
  }

  @Post(':id/blanquear-contrasena')
  @HttpCode(HttpStatus.OK)
  @RequierePermiso('puedeBlanquearContrasenaUsuario')
  async blanquearContrasenia(
    @Param('id') id: string,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const usuario = await this.usuariosService.blanquearContrasenia(id, operador);
    return respuestaOk(usuario, 'Contraseña blanqueada correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequierePermiso('puedeEliminarUsuario')
  async eliminar(@Param('id') id: string, @UsuarioSesionActual() operador: UsuarioSesion) {
    await this.usuariosService.eliminar(id, operador);
    return respuestaOk(null, 'Usuario eliminado correctamente.');
  }
}
