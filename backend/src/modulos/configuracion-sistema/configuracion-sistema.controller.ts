import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RequiereMenu } from '../../comunes/decoradores/requiere-permiso.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ConfiguracionSistemaService } from './configuracion-sistema.service';
import { ActualizarConfiguracionSistemaDto } from './dto/actualizar-configuracion-sistema.dto';

@Controller('configuracion/sistema')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ConfiguracionSistemaController {
  constructor(private readonly configuracionSistemaService: ConfiguracionSistemaService) {}

  @Get()
  async obtener() {
    const datos = await this.configuracionSistemaService.obtener();
    return respuestaOk(datos, 'Configuración del sistema obtenida correctamente.');
  }

  @Patch()
  @RequiereMenu('configuracion')
  async actualizar(@Body() datos: ActualizarConfiguracionSistemaDto) {
    const configuracion = await this.configuracionSistemaService.actualizar(datos);
    return respuestaOk(configuracion, 'Configuración del sistema actualizada correctamente.');
  }
}
