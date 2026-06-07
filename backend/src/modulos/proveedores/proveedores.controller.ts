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
import { RequiereMenu } from '../../comunes/decoradores/requiere-permiso.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { HabilitacionProveedorDto } from './dto/habilitacion-proveedor.dto';
import { ProveedoresService } from './proveedores.service';

@Controller('proveedores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Get()
  async listar() {
    const datos = await this.proveedoresService.listar();
    return respuestaOk(datos, 'Proveedores obtenidos correctamente.');
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    const proveedor = await this.proveedoresService.obtenerPorId(id);
    return respuestaOk(proveedor, 'Proveedor obtenido correctamente.');
  }

  @Post()
  @RequiereMenu('compras')
  async crear(@Body() datos: CrearProveedorDto) {
    const proveedor = await this.proveedoresService.crear(datos);
    return respuestaOk(proveedor, 'Proveedor creado correctamente.');
  }

  @Patch(':id')
  @RequiereMenu('compras')
  async actualizar(@Param('id') id: string, @Body() datos: ActualizarProveedorDto) {
    const proveedor = await this.proveedoresService.actualizar(id, datos);
    return respuestaOk(proveedor, 'Proveedor actualizado correctamente.');
  }

  @Patch(':id/habilitado')
  @RequiereMenu('compras')
  async establecerHabilitacion(
    @Param('id') id: string,
    @Body() datos: HabilitacionProveedorDto,
  ) {
    const proveedor = await this.proveedoresService.establecerHabilitacion(id, datos.habilitado);
    return respuestaOk(proveedor, 'Estado del proveedor actualizado correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequiereMenu('compras')
  async eliminar(@Param('id') id: string) {
    await this.proveedoresService.eliminar(id);
    return respuestaOk(null, 'Proveedor eliminado correctamente.');
  }
}
