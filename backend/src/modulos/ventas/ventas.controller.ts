import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';
import { VentasService } from './ventas.service';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  async listar() {
    const datos = await this.ventasService.listar();
    return respuestaOk(datos, 'Ventas obtenidas correctamente.');
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    const venta = await this.ventasService.obtenerPorId(id);
    return respuestaOk(venta, 'Venta obtenida correctamente.');
  }

  @Post()
  async registrar(@Body() datos: RegistrarVentaDto, @UsuarioSesionActual() operador: UsuarioSesion) {
    const venta = await this.ventasService.registrar(datos, operador);
    return respuestaOk(venta, 'Venta registrada correctamente.');
  }
}
