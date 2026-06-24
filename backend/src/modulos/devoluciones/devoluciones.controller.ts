import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_VENTAS } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { IdEntidadPipe } from '../../comunes/pipes/id-entidad.pipe';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { DevolucionesService } from './devoluciones.service';
import { RegistrarDevolucionDto } from './dto/registrar-devolucion.dto';

@Controller('devoluciones')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class DevolucionesController {
  constructor(private readonly devolucionesService: DevolucionesService) {}

  @Get()
  @RequiereAlgunoMenu(...MENUS_LECTURA_VENTAS)
  async listar() {
    const datos = await this.devolucionesService.listar();
    return respuestaOk(datos, 'Devoluciones obtenidas correctamente.');
  }

  @Get('por-venta/:ventaId')
  @RequiereAlgunoMenu(...MENUS_LECTURA_VENTAS)
  async listarPorVenta(@Param('ventaId', IdEntidadPipe) ventaId: string) {
    const datos = await this.devolucionesService.listarPorVenta(ventaId);
    return respuestaOk(datos, 'Devoluciones de la venta obtenidas correctamente.');
  }

  @Post()
  @RequierePermiso('puedeRegistrarVentas')
  async registrar(
    @Body() datos: RegistrarDevolucionDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const devolucion = await this.devolucionesService.registrar(datos, operador);
    return respuestaOk(devolucion, 'Devolución registrada correctamente.');
  }
}
