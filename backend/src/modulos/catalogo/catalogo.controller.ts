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
  Query,
  UseGuards,
} from '@nestjs/common';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { CatalogoService } from './catalogo.service';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { ActualizarVarianteDto } from './dto/actualizar-variante.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { CrearVarianteDto } from './dto/crear-variante.dto';

@Controller('catalogo')
@UseGuards(JwtAuthGuard)
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('productos')
  async listarProductos() {
    const datos = await this.catalogoService.listarProductos();
    return respuestaOk(datos, 'Productos obtenidos correctamente.');
  }

  @Get('productos/:id')
  async obtenerProducto(@Param('id') id: string) {
    const producto = await this.catalogoService.obtenerProductoPorId(id);
    return respuestaOk(producto, 'Producto obtenido correctamente.');
  }

  @Post('productos')
  async crearProducto(@Body() datos: CrearProductoDto) {
    const producto = await this.catalogoService.crearProducto(datos);
    return respuestaOk(producto, 'Producto creado correctamente.');
  }

  @Patch('productos/:id')
  async actualizarProducto(@Param('id') id: string, @Body() datos: ActualizarProductoDto) {
    const producto = await this.catalogoService.actualizarProducto(id, datos);
    return respuestaOk(producto, 'Producto actualizado correctamente.');
  }

  @Delete('productos/:id')
  @HttpCode(HttpStatus.OK)
  async eliminarProducto(@Param('id') id: string) {
    await this.catalogoService.eliminarProducto(id);
    return respuestaOk(null, 'Producto eliminado correctamente.');
  }

  @Get('variantes')
  async listarVariantes(@Query('productoId') productoId: string) {
    const variantes = await this.catalogoService.listarVariantes(productoId);
    return respuestaOk(variantes, 'Variantes obtenidas correctamente.');
  }

  @Post('variantes')
  async crearVariante(@Body() datos: CrearVarianteDto) {
    const variante = await this.catalogoService.crearVariante(datos);
    return respuestaOk(variante, 'Variante creada correctamente.');
  }

  @Patch('variantes/:id')
  async actualizarVariante(@Param('id') id: string, @Body() datos: ActualizarVarianteDto) {
    const variante = await this.catalogoService.actualizarVariante(id, datos);
    return respuestaOk(variante, 'Variante actualizada correctamente.');
  }

  @Delete('variantes/:id')
  @HttpCode(HttpStatus.OK)
  async eliminarVariante(@Param('id') id: string) {
    await this.catalogoService.eliminarVariante(id);
    return respuestaOk(null, 'Variante eliminada correctamente.');
  }
}
