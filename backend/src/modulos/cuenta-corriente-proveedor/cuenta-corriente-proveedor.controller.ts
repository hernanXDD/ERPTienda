import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_PROVEEDORES } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { CuentaCorrienteProveedorService } from './cuenta-corriente-proveedor.service';
import { RegistrarPagoProveedorDto } from './dto/registrar-pago-proveedor.dto';

@Controller('proveedores/:proveedorId/cuenta-corriente')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class CuentaCorrienteProveedorController {
  constructor(private readonly cuentaCorrienteProveedorService: CuentaCorrienteProveedorService) {}

  @Get('movimientos')
  @RequiereAlgunoMenu(...MENUS_LECTURA_PROVEEDORES)
  async listarMovimientos(@Param('proveedorId') proveedorId: string) {
    const datos = await this.cuentaCorrienteProveedorService.listarMovimientosConSaldo(proveedorId);
    return respuestaOk(datos, 'Movimientos obtenidos correctamente.');
  }

  @Get('saldo')
  @RequiereAlgunoMenu(...MENUS_LECTURA_PROVEEDORES)
  async obtenerSaldo(@Param('proveedorId') proveedorId: string) {
    const saldo = await this.cuentaCorrienteProveedorService.obtenerSaldo(proveedorId);
    return respuestaOk({ saldo }, 'Saldo obtenido correctamente.');
  }

  @Post('pago')
  @RequierePermiso('puedeGestionarCuentaCorrienteProveedor')
  async registrarPago(
    @Param('proveedorId') proveedorId: string,
    @Body() datos: RegistrarPagoProveedorDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const movimiento = await this.cuentaCorrienteProveedorService.registrarPago(
      proveedorId,
      datos,
      operador,
    );
    return respuestaOk(movimiento, 'Pago registrado correctamente.');
  }
}
