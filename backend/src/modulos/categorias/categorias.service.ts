import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

export interface CategoriaApi {
  id: string;
  nombre: string;
  descripcion: string;
}

@Injectable()
export class CategoriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private mapear(categoria: { id: string; nombre: string; descripcion: string }): CategoriaApi {
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
    };
  }

  async listar(): Promise<CategoriaApi[]> {
    const filas = await this.prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
    return filas.map((c) => this.mapear(c));
  }

  async crear(datos: CrearCategoriaDto): Promise<CategoriaApi> {
    const nombre = datos.nombre.trim();
    const existente = await this.prisma.categoria.findUnique({ where: { nombre } });
    if (existente) {
      throw new ConflictException('Ya existe una categoría con ese nombre.');
    }

    const id = await this.idSecuencia.siguienteCategoria();
    const creada = await this.prisma.categoria.create({
      data: {
        id,
        nombre,
        descripcion: datos.descripcion?.trim() ?? '',
      },
    });
    return this.mapear(creada);
  }

  async actualizar(id: string, datos: ActualizarCategoriaDto): Promise<CategoriaApi> {
    await this.obtenerOError(id);
    const nombre = datos.nombre.trim();
    const duplicada = await this.prisma.categoria.findFirst({
      where: { nombre, NOT: { id } },
    });
    if (duplicada) {
      throw new ConflictException('Ya existe otra categoría con ese nombre.');
    }

    const actualizada = await this.prisma.categoria.update({
      where: { id },
      data: {
        nombre,
        descripcion: datos.descripcion?.trim() ?? '',
      },
    });
    return this.mapear(actualizada);
  }

  async eliminar(id: string): Promise<void> {
    await this.obtenerOError(id);
    const productos = await this.prisma.producto.count({
      where: { categoriaId: id, fechaEliminacion: null },
    });
    if (productos > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene productos asociados.',
      );
    }
    await this.prisma.categoria.delete({ where: { id } });
  }

  private async obtenerOError(id: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoría no encontrada.');
    return categoria;
  }
}
