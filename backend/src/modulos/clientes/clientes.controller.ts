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
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { ClientesService } from './clientes.service';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { HabilitacionClienteDto } from './dto/habilitacion-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  async listar() {
    const datos = await this.clientesService.listar();
    return respuestaOk(datos, 'Clientes obtenidos correctamente.');
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    const cliente = await this.clientesService.obtenerPorId(id);
    return respuestaOk(cliente, 'Cliente obtenido correctamente.');
  }

  @Post()
  async crear(@Body() datos: CrearClienteDto) {
    const cliente = await this.clientesService.crear(datos);
    return respuestaOk(cliente, 'Cliente creado correctamente.');
  }

  @Patch(':id')
  async actualizar(@Param('id') id: string, @Body() datos: ActualizarClienteDto) {
    const cliente = await this.clientesService.actualizar(id, datos);
    return respuestaOk(cliente, 'Cliente actualizado correctamente.');
  }

  @Patch(':id/habilitado')
  async establecerHabilitacion(
    @Param('id') id: string,
    @Body() datos: HabilitacionClienteDto,
  ) {
    const cliente = await this.clientesService.establecerHabilitacion(id, datos.habilitado);
    return respuestaOk(cliente, 'Estado del cliente actualizado correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string) {
    await this.clientesService.eliminar(id);
    return respuestaOk(null, 'Cliente eliminado correctamente.');
  }
}
