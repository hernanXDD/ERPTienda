import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoTalleCatalogo } from '@prisma/client';
import {
  CODIGO_TALLE_UNICO,
  claveComparacionTalleCatalogo,
  inferirTipoTalleCatalogo,
  normalizarCodigoTalleCatalogo,
  type TipoTalleCatalogoApi,
} from '../../comunes/constantes/talle-catalogo';
import { datosMarcarBorrado, filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarTalleCatalogoDto } from './dto/actualizar-talle-catalogo.dto';
import { CrearTalleCatalogoDto } from './dto/crear-talle-catalogo.dto';

export interface TalleCatalogoApi {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoTalleCatalogoApi;
  habilitado: boolean;
  orden: number;
}

@Injectable()
export class TallesCatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private mapear(registro: {
    id: string;
    codigo: string;
    nombre: string;
    tipo: TipoTalleCatalogo;
    habilitado: boolean;
    orden: number;
  }): TalleCatalogoApi {
    return {
      id: registro.id,
      codigo: registro.codigo,
      nombre: registro.nombre,
      tipo: registro.tipo,
      habilitado: registro.habilitado,
      orden: registro.orden,
    };
  }

  async listar(): Promise<TalleCatalogoApi[]> {
    const filas = await this.prisma.talleCatalogo.findMany({
      where: filtroNoBorrado,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
    return filas.map((f) => this.mapear(f));
  }

  async crear(datos: CrearTalleCatalogoDto): Promise<TalleCatalogoApi> {
    const nombre = datos.nombre.trim();
    const codigo = normalizarCodigoTalleCatalogo(nombre);
    if (!codigo) {
      throw new BadRequestException('El talle es obligatorio.');
    }

    await this.asegurarCodigoDisponible(codigo);

    const tipo = datos.tipo ?? inferirTipoTalleCatalogo(codigo);
    const maxOrden = await this.prisma.talleCatalogo.aggregate({
      where: filtroNoBorrado,
      _max: { orden: true },
    });
    const id = await this.idSecuencia.siguienteTalleCatalogo();

    const creado = await this.prisma.talleCatalogo.create({
      data: {
        id,
        codigo,
        nombre: nombre.slice(0, 100),
        tipo,
        habilitado: datos.habilitado ?? true,
        orden: (maxOrden._max.orden ?? 0) + 1,
      },
    });
    return this.mapear(creado);
  }

  async actualizar(id: string, datos: ActualizarTalleCatalogoDto): Promise<TalleCatalogoApi> {
    const existente = await this.obtenerOError(id);
    const nombre = datos.nombre.trim();
    if (!nombre) {
      throw new BadRequestException('El nombre del talle es obligatorio.');
    }

    const codigoPropuesto = normalizarCodigoTalleCatalogo(nombre);
    await this.asegurarCodigoDisponible(codigoPropuesto, id);

    const actualizado = await this.prisma.talleCatalogo.update({
      where: { id },
      data: {
        nombre: nombre.slice(0, 100),
        tipo: datos.tipo,
        habilitado: datos.habilitado,
        orden: datos.orden ?? existente.orden,
      },
    });
    return this.mapear(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.obtenerOError(id);
    if (existente.codigo === CODIGO_TALLE_UNICO) {
      throw new ConflictException('No se puede eliminar el talle reservado ÚNICO.');
    }

    const variantes = await this.prisma.variante.count({
      where: {
        borrado: false,
        talle: { equals: existente.codigo, mode: 'insensitive' },
      },
    });
    if (variantes > 0) {
      throw new ConflictException(
        'No se puede eliminar el talle porque hay variantes de producto que lo usan.',
      );
    }

    await this.prisma.talleCatalogo.update({
      where: { id },
      data: datosMarcarBorrado(),
    });
  }

  private async obtenerOError(id: string) {
    const talle = await this.prisma.talleCatalogo.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!talle) throw new NotFoundException('Talle no encontrado.');
    return talle;
  }

  private async asegurarCodigoDisponible(codigo: string, excluirId?: string): Promise<void> {
    const clave = claveComparacionTalleCatalogo(codigo);
    const existentes = await this.prisma.talleCatalogo.findMany({
      where: {
        borrado: false,
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { codigo: true, nombre: true },
    });
    const duplicado = existentes.find(
      (fila) => claveComparacionTalleCatalogo(fila.codigo) === clave,
    );
    if (duplicado) {
      throw new ConflictException(
        `Ya existe el talle «${duplicado.nombre}». No se distinguen mayúsculas y minúsculas.`,
      );
    }
  }
}
