import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_COMPRAS } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { ComprasService } from './compras.service';
import { RegistrarCompraDto } from './dto/registrar-compra.dto';

@Controller('compras')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  @RequiereAlgunoMenu(...MENUS_LECTURA_COMPRAS)
  async listar() {
    const datos = await this.comprasService.listar();
    return respuestaOk(datos, 'Compras obtenidas correctamente.');
  }

  @Get(':id')
  @RequiereAlgunoMenu(...MENUS_LECTURA_COMPRAS)
  async obtenerPorId(@Param('id') id: string) {
    const compra = await this.comprasService.obtenerPorId(id);
    return respuestaOk(compra, 'Compra obtenida correctamente.');
  }

  @Post()
  @RequierePermiso('puedeRegistrarCompras')
  async registrar(@Body() datos: RegistrarCompraDto, @UsuarioSesionActual() operador: UsuarioSesion) {
    const compra = await this.comprasService.registrar(datos, operador);
    return respuestaOk(compra, 'Compra registrada correctamente.');
  }
}
