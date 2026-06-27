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
import { MENUS_LECTURA_CATALOGO } from '../../comunes/permisos/menus-lectura';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ActualizarTalleCatalogoDto } from './dto/actualizar-talle-catalogo.dto';
import { CrearTalleCatalogoDto } from './dto/crear-talle-catalogo.dto';
import { TallesCatalogoService } from './talles-catalogo.service';

@Controller('talles-catalogo')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class TallesCatalogoController {
  constructor(private readonly tallesCatalogoService: TallesCatalogoService) {}

  @Get()
  @RequiereAlgunoMenu('configuracion', ...MENUS_LECTURA_CATALOGO)
  async listar() {
    const datos = await this.tallesCatalogoService.listar();
    return respuestaOk(datos, 'Talles obtenidos correctamente.');
  }

  @Post()
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async crear(@Body() datos: CrearTalleCatalogoDto) {
    const talle = await this.tallesCatalogoService.crear(datos);
    return respuestaOk(talle, 'Talle creado correctamente.');
  }

  @Patch(':id')
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async actualizar(@Param('id') id: string, @Body() datos: ActualizarTalleCatalogoDto) {
    const talle = await this.tallesCatalogoService.actualizar(id, datos);
    return respuestaOk(talle, 'Talle actualizado correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequierePermiso('puedeEditarConfiguracionSistema')
  async eliminar(@Param('id') id: string) {
    await this.tallesCatalogoService.eliminar(id);
    return respuestaOk(null, 'Talle eliminado correctamente.');
  }
}
