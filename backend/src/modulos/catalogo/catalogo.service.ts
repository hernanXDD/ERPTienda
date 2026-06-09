import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { datosMarcarBorrado, filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { claveUnicaVariante } from '../../comunes/utilidades/clave-variante';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { armarNombreLineaComercial } from '../../comunes/utilidades/nombre-linea-comercial';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { ActualizarVarianteDto } from './dto/actualizar-variante.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { CrearVarianteDto } from './dto/crear-variante.dto';

export interface ProductoApi {
  id: string;
  nombre: string;
  marca: string;
  descripcion: string;
  categoriaId: string;
  precioVenta: number;
}

export interface ProductoConCategoriaApi extends ProductoApi {
  nombreCategoria: string;
}

export interface VarianteApi {
  id: string;
  productoId: string;
  talle: string;
  color: string;
  codigoBarras: string;
  activa: boolean;
}

@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  async nombreLineaComercial(varianteId: string): Promise<string> {
    const variante = await this.prisma.variante.findUnique({
      where: { id: varianteId },
      include: { producto: true },
    });
    if (!variante || variante.borrado || variante.producto.borrado) return 'Artículo';
    return armarNombreLineaComercial(
      variante.producto.nombre,
      variante.talle,
      variante.color,
    );
  }

  async listarProductos(): Promise<ProductoConCategoriaApi[]> {
    const filas = await this.prisma.producto.findMany({
      where: filtroNoBorrado,
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    });
    return filas.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      marca: p.marca,
      descripcion: p.descripcion,
      categoriaId: p.categoriaId,
      precioVenta: decimalANumero(p.precioVenta),
      nombreCategoria: p.categoria.nombre,
    }));
  }

  async obtenerProductoPorId(id: string): Promise<ProductoConCategoriaApi> {
    const producto = await this.prisma.producto.findFirst({
      where: { id, ...filtroNoBorrado },
      include: { categoria: true },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado.');
    return {
      id: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      descripcion: producto.descripcion,
      categoriaId: producto.categoriaId,
      precioVenta: decimalANumero(producto.precioVenta),
      nombreCategoria: producto.categoria.nombre,
    };
  }

  async crearProducto(datos: CrearProductoDto): Promise<ProductoConCategoriaApi> {
    await this.validarCategoriaExiste(datos.categoriaId);
    const id = await this.idSecuencia.siguienteProducto();
    const creado = await this.prisma.producto.create({
      data: {
        id,
        nombre: datos.nombre.trim(),
        marca: datos.marca.trim(),
        descripcion: datos.descripcion?.trim() ?? '',
        categoriaId: datos.categoriaId,
        precioVenta: new Prisma.Decimal(datos.precioVenta),
      },
      include: { categoria: true },
    });
    return {
      id: creado.id,
      nombre: creado.nombre,
      marca: creado.marca,
      descripcion: creado.descripcion,
      categoriaId: creado.categoriaId,
      precioVenta: decimalANumero(creado.precioVenta),
      nombreCategoria: creado.categoria.nombre,
    };
  }

  async actualizarProducto(id: string, datos: ActualizarProductoDto): Promise<ProductoConCategoriaApi> {
    await this.obtenerProductoOError(id);
    await this.validarCategoriaExiste(datos.categoriaId);
    const actualizado = await this.prisma.producto.update({
      where: { id },
      data: {
        nombre: datos.nombre.trim(),
        marca: datos.marca.trim(),
        descripcion: datos.descripcion?.trim() ?? '',
        categoriaId: datos.categoriaId,
        precioVenta: new Prisma.Decimal(datos.precioVenta),
      },
      include: { categoria: true },
    });
    return {
      id: actualizado.id,
      nombre: actualizado.nombre,
      marca: actualizado.marca,
      descripcion: actualizado.descripcion,
      categoriaId: actualizado.categoriaId,
      precioVenta: decimalANumero(actualizado.precioVenta),
      nombreCategoria: actualizado.categoria.nombre,
    };
  }

  async eliminarProducto(id: string): Promise<void> {
    await this.obtenerProductoOError(id);
    await this.prisma.producto.update({
      where: { id },
      data: datosMarcarBorrado(),
    });
  }

  async listarVariantes(productoId?: string): Promise<VarianteApi[]> {
    if (productoId) {
      const producto = await this.prisma.producto.findFirst({
        where: { id: productoId, ...filtroNoBorrado },
      });
      if (!producto) throw new NotFoundException('Producto no encontrado.');
    }

    const variantes = await this.prisma.variante.findMany({
      where: productoId
        ? { productoId, ...filtroNoBorrado, producto: filtroNoBorrado }
        : { ...filtroNoBorrado, producto: filtroNoBorrado },
      orderBy: [{ talle: 'asc' }, { color: 'asc' }],
    });
    return variantes.map((v) => this.mapearVariante(v));
  }

  async crearVariante(datos: CrearVarianteDto): Promise<VarianteApi> {
    await this.obtenerProductoOError(datos.productoId);
    if (await this.existeCombinacionVariante(datos.productoId, datos.talle, datos.color)) {
      throw new ConflictException('Ya existe una variante con ese talle y color para el producto.');
    }

    const variante = await this.prisma.$transaction(async (tx) => {
      const idVariante = await this.idSecuencia.siguienteVariante(tx);
      const creada = await tx.variante.create({
        data: {
          id: idVariante,
          productoId: datos.productoId,
          talle: datos.talle.trim(),
          color: datos.color.trim(),
          codigoBarras: datos.codigoBarras?.trim() ?? '',
          activa: datos.activa ?? true,
        },
      });
      await tx.stockVariante.create({
        data: { varianteId: creada.id, cantidadActual: 0 },
      });
      return creada;
    });

    return this.mapearVariante(variante);
  }

  async actualizarVariante(id: string, datos: ActualizarVarianteDto): Promise<VarianteApi> {
    const anterior = await this.prisma.variante.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!anterior) throw new NotFoundException('Variante no encontrada.');
    await this.obtenerProductoOError(datos.productoId);

    if (
      await this.existeCombinacionVariante(
        datos.productoId,
        datos.talle,
        datos.color,
        id,
      )
    ) {
      throw new ConflictException('Ya existe otra variante con ese talle y color.');
    }

    const actualizada = await this.prisma.variante.update({
      where: { id },
      data: {
        productoId: datos.productoId,
        talle: datos.talle.trim(),
        color: datos.color.trim(),
        codigoBarras: datos.codigoBarras?.trim() ?? '',
        activa: datos.activa ?? anterior.activa,
      },
    });
    return this.mapearVariante(actualizada);
  }

  async eliminarVariante(id: string): Promise<void> {
    const variante = await this.prisma.variante.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!variante) throw new NotFoundException('Variante no encontrada.');

    const activas = await this.prisma.variante.count({
      where: { productoId: variante.productoId, activa: true, ...filtroNoBorrado },
    });
    if (activas <= 1 && variante.activa) {
      throw new ConflictException(
        'No se puede eliminar la única variante activa del producto.',
      );
    }

    await this.prisma.variante.update({
      where: { id },
      data: datosMarcarBorrado(),
    });
  }

  private mapearVariante(variante: {
    id: string;
    productoId: string;
    talle: string;
    color: string;
    codigoBarras: string;
    activa: boolean;
  }): VarianteApi {
    return {
      id: variante.id,
      productoId: variante.productoId,
      talle: variante.talle,
      color: variante.color,
      codigoBarras: variante.codigoBarras,
      activa: variante.activa,
    };
  }

  private async existeCombinacionVariante(
    productoId: string,
    talle: string,
    color: string,
    excluirVarianteId?: string,
  ): Promise<boolean> {
    const clave = claveUnicaVariante(talle, color);
    const variantes = await this.prisma.variante.findMany({
      where: { productoId, ...filtroNoBorrado },
    });
    return variantes.some(
      (v) =>
        v.id !== excluirVarianteId && claveUnicaVariante(v.talle, v.color) === clave,
    );
  }

  private async obtenerProductoOError(id: string) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado.');
    return producto;
  }

  private async validarCategoriaExiste(categoriaId: string): Promise<void> {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, ...filtroNoBorrado },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada.');
  }
}
