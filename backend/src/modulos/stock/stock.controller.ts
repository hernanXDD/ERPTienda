import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { AjusteConteoDto } from './dto/ajuste-conteo.dto';
import { EntradaManualDto } from './dto/entrada-manual.dto';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('movimientos')
  async listarMovimientos(
    @Query('varianteId') varianteId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const datos = await this.stockService.listarMovimientos({
      varianteId,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
    });
    return respuestaOk(datos, 'Movimientos de stock obtenidos correctamente.');
  }

  @Get('cantidad/:varianteId')
  async obtenerCantidad(@Param('varianteId') varianteId: string) {
    const cantidad = await this.stockService.obtenerCantidad(varianteId);
    return respuestaOk({ varianteId, cantidad }, 'Cantidad obtenida correctamente.');
  }

  @Get('resumen')
  async obtenerResumen() {
    const datos = await this.stockService.obtenerResumen();
    return respuestaOk(datos, 'Resumen de stock obtenido correctamente.');
  }

  @Post('ajuste-conteo')
  async ajusteConteo(
    @Body() datos: AjusteConteoDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const resultado = await this.stockService.aplicarAjustePorConteo(datos, operador.id);
    return respuestaOk(resultado, 'Ajuste por conteo registrado correctamente.');
  }

  @Post('entrada-manual')
  async entradaManual(
    @Body() datos: EntradaManualDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const resultado = await this.stockService.aplicarEntradaManual(datos, operador.id);
    return respuestaOk(resultado, 'Entrada manual registrada correctamente.');
  }
}
