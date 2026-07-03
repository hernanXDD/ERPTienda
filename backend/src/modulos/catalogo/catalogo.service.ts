import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoAuditoriaStock } from '@prisma/client';
import { ID_MOTIVO_AJUSTE_CONTEO } from '../../comunes/constantes/ids-motivo-stock';
import { datosMarcarBorrado, filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { claveUnicaVariante } from '../../comunes/utilidades/clave-variante';
import {
  codigoBarrasDesdeIdVariante,
  esCodigoBarrasEan13Valido,
} from '../../comunes/utilidades/codigo-barras-interno';
import { crearFechaAgotadoInicial, resolverFechaAgotadoStock } from '../../comunes/utilidades/fecha-agotado-stock';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { armarNombreLineaComercial } from '../../comunes/utilidades/nombre-linea-comercial';
import { PermisosUsuarioService } from '../../comunes/permisos/permisos-usuario.service';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { ActualizarVarianteDto } from './dto/actualizar-variante.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { CrearVarianteDto } from './dto/crear-variante.dto';
import { ImportarStockInicialDto, LineaImportarStockInicialDto } from './dto/importar-stock-inicial.dto';
import { ConfiguracionSistemaService } from '../configuracion-sistema/configuracion-sistema.service';
import { aplicarDeshabilitacionAutomaticaVariantes } from '../stock/utilidades/deshabilitacion-automatica-stock';

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

export interface DetalleImportacionStockInicialApi {
  productoId: string;
  varianteId: string;
  nombreVariante: string;
  codigoBarras: string;
  stock: number;
}

export interface ResultadoImportacionStockInicialApi {
  productosCreados: number;
  variantesCreadas: number;
  unidadesStock: number;
  detalle: DetalleImportacionStockInicialApi[];
}

type ClienteTx = Prisma.TransactionClient;

interface GrupoProductoImportacion {
  clave: string;
  lineas: LineaImportarStockInicialDto[];
}

@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
    private readonly configuracionSistemaService: ConfiguracionSistemaService,
    private readonly permisosUsuario: PermisosUsuarioService,
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
    await this.ejecutarDeshabilitacionAutomaticaSiCorresponde();

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
    await this.ejecutarDeshabilitacionAutomaticaSiCorresponde();

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
    if (await this.existeCombinacionVariante(datos.productoId, datos.talle, datos.color ?? '')) {
      throw new ConflictException('Ya existe una variante con ese talle para el producto.');
    }

    const color = datos.color?.trim() ?? '';

    const variante = await this.prisma.$transaction(async (tx) => {
      const idVariante = await this.idSecuencia.siguienteVariante(tx);
      const creada = await tx.variante.create({
        data: {
          id: idVariante,
          productoId: datos.productoId,
          talle: datos.talle.trim(),
          color,
          codigoBarras: datos.codigoBarras?.trim() ?? '',
          activa: datos.activa ?? true,
        },
      });
      await tx.stockVariante.create({
        data: { varianteId: creada.id, cantidadActual: 0, fechaAgotado: crearFechaAgotadoInicial() },
      });
      return creada;
    });

    return this.mapearVariante(variante);
  }

  async importarStockInicialMasivo(
    datos: ImportarStockInicialDto,
    ejecutadoPorUsuarioId: string,
  ): Promise<ResultadoImportacionStockInicialApi> {
    const puedeAjustar = await this.permisosUsuario.tienePermiso(
      ejecutadoPorUsuarioId,
      'puedeAjustarStock',
    );
    if (!puedeAjustar) {
      throw new ForbiddenException(
        'Para cargar stock inicial también necesitás el permiso de conteos de inventario.',
      );
    }

    const gruposNuevos = this.agruparLineasImportacionStockInicial(
      datos.lineas.filter((linea) => !linea.productoId),
    );
    const lineasVariantesExistentes = datos.lineas.filter((linea) => linea.productoId);
    await this.validarLineasImportacionStockInicial(datos.lineas, gruposNuevos, lineasVariantesExistentes);

    const notaBase = datos.observacion?.trim()
      ? `Carga inicial de catálogo por Excel. ${datos.observacion.trim()}`
      : 'Carga inicial de catálogo por Excel.';

    return this.prisma.$transaction(async (tx) => {
      const detalle: DetalleImportacionStockInicialApi[] = [];
      let productosCreados = 0;
      let variantesCreadas = 0;
      let unidadesStock = 0;
      const movimientosPendientes: Array<{
        varianteId: string;
        nombreVariante: string;
        stock: number;
      }> = [];

      for (const grupo of gruposNuevos) {
        const primera = grupo.lineas[0];
        const idProducto = await this.idSecuencia.siguienteProducto(tx);
        await tx.producto.create({
          data: {
            id: idProducto,
            nombre: primera.nombre.trim(),
            marca: primera.marca.trim(),
            descripcion: primera.descripcion?.trim() ?? '',
            categoriaId: primera.categoriaId,
            precioVenta: new Prisma.Decimal(primera.precioVenta),
          },
        });
        productosCreados += 1;

        for (const linea of grupo.lineas) {
          const idVariante = await this.idSecuencia.siguienteVariante(tx);
          const codigoBarras =
            linea.codigoBarras?.trim() || codigoBarrasDesdeIdVariante(idVariante);
          const stock = linea.stock;

          await tx.variante.create({
            data: {
              id: idVariante,
              productoId: idProducto,
              talle: linea.talle.trim(),
              color: '',
              codigoBarras,
              activa: true,
            },
          });
          await tx.stockVariante.create({
            data: {
              varianteId: idVariante,
              cantidadActual: stock,
              fechaAgotado: resolverFechaAgotadoStock(0, stock, crearFechaAgotadoInicial()),
            },
          });

          const nombreVariante = armarNombreLineaComercial(
            primera.nombre.trim(),
            linea.talle.trim(),
            '',
          );
          variantesCreadas += 1;
          unidadesStock += stock;
          detalle.push({
            productoId: idProducto,
            varianteId: idVariante,
            nombreVariante,
            codigoBarras,
            stock,
          });

          if (stock > 0) {
            movimientosPendientes.push({
              varianteId: idVariante,
              nombreVariante,
              stock,
            });
          }
        }
      }

      for (const linea of lineasVariantesExistentes) {
        const producto = await tx.producto.findFirst({
          where: { id: linea.productoId!, ...filtroNoBorrado },
        });
        if (!producto) {
          throw new NotFoundException(`Producto no encontrado: ${linea.productoId}.`);
        }

        const idVariante = await this.idSecuencia.siguienteVariante(tx);
        const codigoBarras =
          linea.codigoBarras?.trim() || codigoBarrasDesdeIdVariante(idVariante);
        const stock = linea.stock;

        await tx.variante.create({
          data: {
            id: idVariante,
            productoId: producto.id,
            talle: linea.talle.trim(),
            color: '',
            codigoBarras,
            activa: true,
          },
        });
        await tx.stockVariante.create({
          data: {
            varianteId: idVariante,
            cantidadActual: stock,
            fechaAgotado: resolverFechaAgotadoStock(0, stock, crearFechaAgotadoInicial()),
          },
        });

        const nombreVariante = armarNombreLineaComercial(
          producto.nombre,
          linea.talle.trim(),
          '',
        );
        variantesCreadas += 1;
        unidadesStock += stock;
        detalle.push({
          productoId: producto.id,
          varianteId: idVariante,
          nombreVariante,
          codigoBarras,
          stock,
        });

        if (stock > 0) {
          movimientosPendientes.push({
            varianteId: idVariante,
            nombreVariante,
            stock,
          });
        }
      }

      if (movimientosPendientes.length > 0) {
        const idAuditoria = await this.crearAuditoriaStockInicial(tx, {
          titulo: `Carga inicial de catálogo (${variantesCreadas} artículos)`,
          nota: notaBase,
          ejecutadoPorUsuarioId,
        });
        const idsMovimientos = await this.idSecuencia.siguientesMovimientoStock(
          movimientosPendientes.length,
          tx,
        );

        for (let i = 0; i < movimientosPendientes.length; i += 1) {
          const fila = movimientosPendientes[i];
          await tx.movimientoStock.create({
            data: {
              id: idsMovimientos[i],
              varianteId: fila.varianteId,
              nombreVariante: fila.nombreVariante,
              motivoId: ID_MOTIVO_AJUSTE_CONTEO,
              cantidadVariacion: fila.stock,
              stockResultante: fila.stock,
              nota: notaBase,
              auditoriaStockId: idAuditoria,
              ejecutadoPorUsuarioId,
            },
          });
        }

        await this.actualizarResumenAuditoriaStock(tx, idAuditoria);
      }

      await this.ejecutarDeshabilitacionAutomaticaEnTransaccion(tx);
      detalle.sort((a, b) => a.nombreVariante.localeCompare(b.nombreVariante, 'es', { sensitivity: 'base' }));

      return {
        productosCreados,
        variantesCreadas,
        unidadesStock,
        detalle,
      };
    });
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
        datos.color ?? '',
        id,
      )
    ) {
      throw new ConflictException('Ya existe otra variante con ese talle.');
    }

    const color = datos.color?.trim() ?? '';

    const actualizada = await this.prisma.variante.update({
      where: { id },
      data: {
        productoId: datos.productoId,
        talle: datos.talle.trim(),
        color,
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

  private async ejecutarDeshabilitacionAutomaticaSiCorresponde(): Promise<void> {
    const configuracion = await this.configuracionSistemaService.obtener();
    await aplicarDeshabilitacionAutomaticaVariantes(
      this.prisma,
      configuracion.diasDeshabilitarProductoStockCero,
    );
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

  private claveGrupoProductoImportacion(linea: LineaImportarStockInicialDto): string {
    return [
      linea.nombre.trim().toLowerCase(),
      linea.marca.trim().toLowerCase(),
      linea.categoriaId,
    ].join('|');
  }

  private agruparLineasImportacionStockInicial(
    lineas: LineaImportarStockInicialDto[],
  ): GrupoProductoImportacion[] {
    const mapa = new Map<string, GrupoProductoImportacion>();
    for (const linea of lineas) {
      const clave = this.claveGrupoProductoImportacion(linea);
      const existente = mapa.get(clave);
      if (existente) {
        existente.lineas.push(linea);
        continue;
      }
      mapa.set(clave, { clave, lineas: [linea] });
    }
    return [...mapa.values()];
  }

  private async validarLineasImportacionStockInicial(
    lineas: LineaImportarStockInicialDto[],
    gruposNuevos: GrupoProductoImportacion[],
    lineasVariantesExistentes: LineaImportarStockInicialDto[],
  ): Promise<void> {
    const idsCategorias = [...new Set(lineas.map((ln) => ln.categoriaId))];
    const categorias = await this.prisma.categoria.findMany({
      where: { id: { in: idsCategorias }, ...filtroNoBorrado },
    });
    const categoriasValidas = new Set(categorias.map((c) => c.id));
    for (const id of idsCategorias) {
      if (!categoriasValidas.has(id)) {
        throw new NotFoundException(`Categoría no encontrada: ${id}.`);
      }
    }

    const codigosBarras = lineas
      .map((ln) => ln.codigoBarras?.trim())
      .filter((codigo): codigo is string => Boolean(codigo));
    if (new Set(codigosBarras).size !== codigosBarras.length) {
      throw new ConflictException('La importación incluye códigos de barras repetidos.');
    }

    if (codigosBarras.length > 0) {
      const existentes = await this.prisma.variante.findMany({
        where: { codigoBarras: { in: codigosBarras }, ...filtroNoBorrado },
        select: { codigoBarras: true },
      });
      if (existentes.length > 0) {
        throw new ConflictException(
          `Ya existe un artículo con el código de barras «${existentes[0].codigoBarras}».`,
        );
      }
    }

    for (const codigo of codigosBarras) {
      if (!esCodigoBarrasEan13Valido(codigo)) {
        throw new ConflictException(`Código de barras inválido: «${codigo}».`);
      }
    }

    for (const grupo of gruposNuevos) {
      const primera = grupo.lineas[0];
      const precio = primera.precioVenta;
      const descripcion = primera.descripcion?.trim() ?? '';

      for (const linea of grupo.lineas) {
        if (linea.precioVenta !== precio) {
          throw new ConflictException(
            `El producto «${primera.nombre}» tiene precios distintos en el archivo.`,
          );
        }
        const descripcionLinea = linea.descripcion?.trim() ?? '';
        if (descripcionLinea !== descripcion) {
          throw new ConflictException(
            `El producto «${primera.nombre}» tiene descripciones distintas en el archivo.`,
          );
        }
      }

      const tallesUsados = new Set<string>();
      for (const linea of grupo.lineas) {
        const claveTalle = claveUnicaVariante(linea.talle, '');
        if (tallesUsados.has(claveTalle)) {
          throw new ConflictException(
            `El producto «${primera.nombre}» incluye el talle «${linea.talle}» más de una vez.`,
          );
        }
        tallesUsados.add(claveTalle);
      }

      const productoExistente = await this.prisma.producto.findFirst({
        where: {
          nombre: { equals: primera.nombre.trim(), mode: 'insensitive' },
          marca: { equals: primera.marca.trim(), mode: 'insensitive' },
          categoriaId: primera.categoriaId,
          ...filtroNoBorrado,
        },
      });
      if (productoExistente) {
        throw new ConflictException(
          `Ya existe el producto «${primera.nombre}» (${primera.marca}) en esa categoría.`,
        );
      }
    }

    const tallesPorProducto = new Map<string, Set<string>>();
    for (const linea of lineasVariantesExistentes) {
      const productoId = linea.productoId!;
      const producto = await this.prisma.producto.findFirst({
        where: { id: productoId, ...filtroNoBorrado },
      });
      if (!producto) {
        throw new NotFoundException(`Producto no encontrado: ${productoId}.`);
      }

      const claveTalle = claveUnicaVariante(linea.talle, '');
      const tallesArchivo = tallesPorProducto.get(productoId) ?? new Set<string>();
      if (tallesArchivo.has(claveTalle)) {
        throw new ConflictException(
          `El producto «${producto.nombre}» incluye el talle «${linea.talle}» más de una vez en el archivo.`,
        );
      }
      tallesArchivo.add(claveTalle);
      tallesPorProducto.set(productoId, tallesArchivo);

      if (await this.existeCombinacionVariante(productoId, linea.talle, '')) {
        throw new ConflictException(
          `El producto «${producto.nombre}» ya tiene el talle «${linea.talle}».`,
        );
      }
    }
  }

  private async crearAuditoriaStockInicial(
    tx: ClienteTx,
    datos: {
      titulo: string;
      nota?: string | null;
      ejecutadoPorUsuarioId?: string | null;
    },
  ): Promise<string> {
    const id = await this.idSecuencia.siguienteAuditoriaStock(tx);
    await tx.auditoriaStock.create({
      data: {
        id,
        tipo: TipoAuditoriaStock.conteo,
        titulo: datos.titulo,
        nota: datos.nota ?? null,
        ejecutadoPorUsuarioId: datos.ejecutadoPorUsuarioId ?? null,
      },
    });
    return id;
  }

  private async actualizarResumenAuditoriaStock(
    tx: ClienteTx,
    auditoriaStockId: string,
  ): Promise<void> {
    const resumen = await tx.movimientoStock.aggregate({
      where: { auditoriaStockId },
      _count: true,
      _sum: { cantidadVariacion: true },
    });

    await tx.auditoriaStock.update({
      where: { id: auditoriaStockId },
      data: {
        cantidadMovimientos: resumen._count,
        variacionNeta: resumen._sum.cantidadVariacion ?? 0,
      },
    });
  }

  private async ejecutarDeshabilitacionAutomaticaEnTransaccion(tx: ClienteTx): Promise<void> {
    const configuracion = await this.configuracionSistemaService.obtener();
    await aplicarDeshabilitacionAutomaticaVariantes(
      tx,
      configuracion.diasDeshabilitarProductoStockCero,
    );
  }
}
