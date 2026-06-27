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
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_VENTAS } from '../../comunes/permisos/menus-lectura';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ActualizarFormaPagoDto } from './dto/actualizar-forma-pago.dto';
import { CrearFormaPagoDto } from './dto/crear-forma-pago.dto';
import { FormasPagoService } from './formas-pago.service';

@Controller('formas-pago')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class FormasPagoController {
  constructor(private readonly formasPagoService: FormasPagoService) {}

  @Get()
  @RequiereAlgunoMenu('configuracion', ...MENUS_LECTURA_VENTAS)
  async listar() {
    const datos = await this.formasPagoService.listar();
    return respuestaOk(datos, 'Formas de pago obtenidas correctamente.');
  }

  @Post()
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async crear(@Body() datos: CrearFormaPagoDto) {
    const forma = await this.formasPagoService.crear(datos);
    return respuestaOk(forma, 'Forma de pago creada correctamente.');
  }

  @Patch(':id')
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async actualizar(@Param('id') id: string, @Body() datos: ActualizarFormaPagoDto) {
    const forma = await this.formasPagoService.actualizar(id, datos);
    return respuestaOk(forma, 'Forma de pago actualizada correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async eliminar(@Param('id') id: string) {
    await this.formasPagoService.eliminar(id);
    return respuestaOk(null, 'Forma de pago eliminada correctamente.');
  }
}
