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
import { CategoriasService } from './categorias.service';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  async listar() {
    const datos = await this.categoriasService.listar();
    return respuestaOk(datos, 'Categorías obtenidas correctamente.');
  }

  @Post()
  async crear(@Body() datos: CrearCategoriaDto) {
    const categoria = await this.categoriasService.crear(datos);
    return respuestaOk(categoria, 'Categoría creada correctamente.');
  }

  @Patch(':id')
  async actualizar(@Param('id') id: string, @Body() datos: ActualizarCategoriaDto) {
    const categoria = await this.categoriasService.actualizar(id, datos);
    return respuestaOk(categoria, 'Categoría actualizada correctamente.');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id') id: string) {
    await this.categoriasService.eliminar(id);
    return respuestaOk(null, 'Categoría eliminada correctamente.');
  }
}
