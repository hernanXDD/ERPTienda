import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_VENTAS } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';
import { CargarFacturacionesDto } from './dto/cargar-facturaciones.dto';
import { VentasService } from './ventas.service';

@Controller('ventas')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  @RequiereAlgunoMenu(...MENUS_LECTURA_VENTAS)
  async listar() {
    const datos = await this.ventasService.listar();
    return respuestaOk(datos, 'Ventas obtenidas correctamente.');
  }

  @Post('cargar-facturaciones')
  @RequierePermiso('puedeCargarFacturaciones')
  async cargarFacturaciones(@Body() datos: CargarFacturacionesDto) {
    const ventas = await this.ventasService.cargarFacturaciones(datos);
    return respuestaOk(ventas, 'Facturaciones cargadas correctamente.');
  }

  @Get(':id')
  @RequiereAlgunoMenu(...MENUS_LECTURA_VENTAS)
  async obtenerPorId(@Param('id') id: string) {
    const venta = await this.ventasService.obtenerPorId(id);
    return respuestaOk(venta, 'Venta obtenida correctamente.');
  }

  @Post()
  @RequierePermiso('puedeRegistrarVentas')
  async registrar(@Body() datos: RegistrarVentaDto, @UsuarioSesionActual() operador: UsuarioSesion) {
    const venta = await this.ventasService.registrar(datos, operador);
    return respuestaOk(venta, 'Venta registrada correctamente.');
  }
}
