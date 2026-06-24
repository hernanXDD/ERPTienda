import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_VENTAS } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { IdEntidadPipe } from '../../comunes/pipes/id-entidad.pipe';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { CuponesDescuentoService } from './cupones-descuento.service';
import { CrearCuponDescuentoDto } from './dto/crear-cupon-descuento.dto';
import { AnularCuponDescuentoDto } from './dto/anular-cupon-descuento.dto';
import { ValidarCuponCodigoDto } from './dto/validar-cupon-codigo.dto';

@Controller('cupones-descuento')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class CuponesDescuentoController {
  constructor(private readonly cuponesDescuentoService: CuponesDescuentoService) {}

  @Get()
  @RequiereAlgunoMenu(...MENUS_LECTURA_VENTAS)
  async listar() {
    const datos = await this.cuponesDescuentoService.listar();
    return respuestaOk(datos, 'Cupones de descuento obtenidos correctamente.');
  }

  @Post()
  @RequierePermiso('puedeRegistrarVentas')
  async crear(
    @Body() datos: CrearCuponDescuentoDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const cupon = await this.cuponesDescuentoService.crear(datos, operador);
    return respuestaOk(cupon, 'Cupón de descuento creado correctamente.');
  }

  @Post('validar-codigo')
  @RequierePermiso('puedeRegistrarVentas')
  async validarCodigo(@Body() datos: ValidarCuponCodigoDto) {
    const cupon = await this.cuponesDescuentoService.validarPorCodigo(
      datos.codigo,
      datos.clienteId,
    );
    return respuestaOk(cupon, 'Cupón válido.');
  }

  @Patch(':id/anular')
  @RequierePermiso('puedeRegistrarVentas')
  async anular(@Param('id', IdEntidadPipe) id: string, @Body() datos: AnularCuponDescuentoDto) {
    const cupon = await this.cuponesDescuentoService.anular(id, datos);
    return respuestaOk(cupon, 'Cupón anulado correctamente.');
  }

  @Get(':id/codigo-barras')
  @RequiereAlgunoMenu(...MENUS_LECTURA_VENTAS)
  async codigoBarras(@Param('id', IdEntidadPipe) id: string) {
    const datos = await this.cuponesDescuentoService.obtenerCodigoBarras(id);
    return respuestaOk(datos, 'Código de barras obtenido correctamente.');
  }
}
