import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RequiereAlgunoMenu, RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_NEGOCIO } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ActualizarNegocioDto } from './dto/actualizar-negocio.dto';
import { LogoNegocioService } from './logo-negocio.service';
import { NegocioService } from './negocio.service';

@Controller('configuracion/negocio')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class NegocioController {
  constructor(
    private readonly negocioService: NegocioService,
    private readonly logoNegocioService: LogoNegocioService,
  ) {}

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

  @Get('logo')
  @RequiereAlgunoMenu(...MENUS_LECTURA_NEGOCIO)
  async obtenerLogo() {
    const archivo = this.logoNegocioService.obtenerArchivoParaDescarga();
    return new StreamableFile(archivo.flujo, { type: archivo.tipoMime });
  }

  @Post('logo')
  @RequierePermiso('puedeEditarConfiguracionNegocio')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async subirLogo(@UploadedFile() archivo: Express.Multer.File) {
    this.logoNegocioService.validarArchivoSubido(archivo);
    const metadatos = this.logoNegocioService.guardarLogo(archivo);
    const negocio = await this.negocioService.obtener();
    return respuestaOk(
      { ...negocio, tieneLogo: metadatos.tieneLogo, logoVersion: metadatos.version, nombreArchivoLogo: metadatos.nombreArchivo },
      'Logo del negocio actualizado correctamente.',
    );
  }

  @Delete('logo')
  @RequierePermiso('puedeEditarConfiguracionNegocio')
  async eliminarLogo() {
    this.logoNegocioService.eliminarLogo();
    const negocio = await this.negocioService.obtener();
    return respuestaOk(negocio, 'Logo del negocio eliminado correctamente.');
  }
}
