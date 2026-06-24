import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_VENTAS } from '../../comunes/permisos/menus-lectura';
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
  @RequiereAlgunoMenu('configuracion', ...MENUS_LECTURA_VENTAS)
  async obtener() {
    const datos = await this.configuracionSistemaService.obtener();
    return respuestaOk(datos, 'Configuración del sistema obtenida correctamente.');
  }

  @Patch()
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async actualizar(@Body() datos: ActualizarConfiguracionSistemaDto) {
    const configuracion = await this.configuracionSistemaService.actualizar(datos);
    return respuestaOk(configuracion, 'Configuración del sistema actualizada correctamente.');
  }
}
