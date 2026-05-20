import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { ComprasService } from './compras.service';
import { RegistrarCompraDto } from './dto/registrar-compra.dto';

@Controller('compras')
@UseGuards(JwtAuthGuard)
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  async listar() {
    const datos = await this.comprasService.listar();
    return respuestaOk(datos, 'Compras obtenidas correctamente.');
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    const compra = await this.comprasService.obtenerPorId(id);
    return respuestaOk(compra, 'Compra obtenida correctamente.');
  }

  @Post()
  async registrar(@Body() datos: RegistrarCompraDto, @UsuarioSesionActual() operador: UsuarioSesion) {
    const compra = await this.comprasService.registrar(datos, operador);
    return respuestaOk(compra, 'Compra registrada correctamente.');
  }
}
