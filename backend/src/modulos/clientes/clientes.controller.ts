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
import { RequiereAlgunoMenu, RequiereMenu } from '../../comunes/decoradores/requiere-permiso.decorator';
import { MENUS_LECTURA_CLIENTES } from '../../comunes/permisos/menus-lectura';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import { ClientesService } from './clientes.service';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { HabilitacionClienteDto } from './dto/habilitacion-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @RequiereAlgunoMenu(...MENUS_LECTURA_CLIENTES)
  async listar() {
    const datos = await this.clientesService.listar();
    return respuestaOk(datos, 'Clientes obtenidos correctamente.');
  }

  @Get(':id')
  @RequiereAlgunoMenu(...MENUS_LECTURA_CLIENTES)
  async obtenerPorId(@Param('id') id: string) {
    const cliente = await this.clientesService.obtenerPorId(id);
    return respuestaOk(cliente, 'Cliente obtenido correctamente.');
  }

  @Post()
  @RequiereMenu('clientes')
  async crear(@Body() datos: CrearClienteDto) {
    const cliente = await this.clientesService.crear(datos);
    return respuestaOk(cliente, 'Cliente creado correctamente.');
  }

  @Patch(':id')
  @RequiereMenu('clientes')
  async actualizar(@Param('id') id: string, @Body() datos: ActualizarClienteDto) {
    const cliente = await this.clientesService.actualizar(id, datos);
    return respuestaOk(cliente, 'Cliente actualizado correctamente.');
  }

  @Patch(':id/habilitado')
  @RequiereMenu('clientes')
  async establecerHabilitacion(
    @Param('id') id: string,
    @Body() datos: HabilitacionClienteDto,
  ) {
    const cliente = await this.clientesService.establecerHabilitacion(id, datos.habilitado);
    return respuestaOk(cliente, 'Estado del cliente actualizado correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequiereMenu('clientes')
  async eliminar(@Param('id') id: string) {
    await this.clientesService.eliminar(id);
    return respuestaOk(null, 'Cliente eliminado correctamente.');
  }
}
