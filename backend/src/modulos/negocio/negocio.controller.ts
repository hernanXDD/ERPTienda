import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_NEGOCIO } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ActualizarNegocioDto } from './dto/actualizar-negocio.dto';
import { NegocioService } from './negocio.service';

@Controller('configuracion/negocio')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class NegocioController {
  constructor(private readonly negocioService: NegocioService) {}

  @Get()
  @RequiereAlgunoMenu(...MENUS_LECTURA_NEGOCIO)
  async obtener() {
    const datos = await this.negocioService.obtener();
    return respuestaOk(datos, 'Datos del negocio obtenidos correctamente.');
  }

  @Patch()
  @RequierePermiso('puedeEditarConfiguracionNegocio')
  async actualizar(@Body() datos: ActualizarNegocioDto) {
    const negocio = await this.negocioService.actualizar(datos);
    return respuestaOk(negocio, 'Datos del negocio actualizados correctamente.');
  }
}
