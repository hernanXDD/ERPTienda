import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';

@Controller('clientes/:clienteId/cuenta-corriente')
@UseGuards(JwtAuthGuard)
export class CuentaCorrienteController {
  constructor(private readonly cuentaCorrienteService: CuentaCorrienteService) {}

  @Get('movimientos')
  async listarMovimientos(@Param('clienteId') clienteId: string) {
    const datos = await this.cuentaCorrienteService.listarMovimientosConSaldo(clienteId);
    return respuestaOk(datos, 'Movimientos obtenidos correctamente.');
  }

  @Get('saldo')
  async obtenerSaldo(@Param('clienteId') clienteId: string) {
    const saldo = await this.cuentaCorrienteService.obtenerSaldo(clienteId);
    return respuestaOk({ saldo }, 'Saldo obtenido correctamente.');
  }

  @Post('pago')
  async registrarPago(
    @Param('clienteId') clienteId: string,
    @Body() datos: RegistrarPagoDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const movimiento = await this.cuentaCorrienteService.registrarPago(clienteId, datos, operador);
    return respuestaOk(movimiento, 'Pago registrado correctamente.');
  }
}
