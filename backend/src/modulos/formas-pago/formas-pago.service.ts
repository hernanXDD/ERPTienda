import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CODIGO_FORMA_PAGO_CUENTA_CORRIENTE,
  normalizarCodigoFormaPagoDesdeNombre,
} from '../../comunes/constantes/forma-pago';
import { datosMarcarBorrado, filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarFormaPagoDto } from './dto/actualizar-forma-pago.dto';
import { CrearFormaPagoDto } from './dto/crear-forma-pago.dto';

export interface FormaPagoApi {
  id: string;
  codigo: string;
  nombre: string;
  facturar: boolean;
  habilitado: boolean;
  orden: number;
}

@Injectable()
export class FormasPagoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private mapear(registro: {
    id: string;
    codigo: string;
    nombre: string;
    facturar: boolean;
    habilitado: boolean;
    orden: number;
  }): FormaPagoApi {
    return {
      id: registro.id,
      codigo: registro.codigo,
      nombre: registro.nombre,
      facturar: registro.facturar,
      habilitado: registro.habilitado,
      orden: registro.orden,
    };
  }

  async listar(): Promise<FormaPagoApi[]> {
    const filas = await this.prisma.formaPago.findMany({
      where: filtroNoBorrado,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
    return filas.map((f) => this.mapear(f));
  }

  async validarCodigoParaVenta(codigo: string): Promise<void> {
    const normalizado = codigo.trim().toUpperCase();
    const forma = await this.prisma.formaPago.findFirst({
      where: { codigo: normalizado, ...filtroNoBorrado },
    });
    if (!forma) {
      throw new BadRequestException('La forma de pago indicada no existe.');
    }
    if (!forma.habilitado) {
      throw new BadRequestException('La forma de pago indicada no está habilitada.');
    }
  }

  async crear(datos: CrearFormaPagoDto): Promise<FormaPagoApi> {
    const nombre = datos.nombre.trim();
    if (!nombre) {
      throw new BadRequestException('El nombre de la forma de pago es obligatorio.');
    }

    const codigo = await this.resolverCodigoUnico(normalizarCodigoFormaPagoDesdeNombre(nombre));
    const maxOrden = await this.prisma.formaPago.aggregate({
      where: filtroNoBorrado,
      _max: { orden: true },
    });
    const id = await this.idSecuencia.siguienteFormaPago();

    const creada = await this.prisma.formaPago.create({
      data: {
        id,
        codigo,
        nombre,
        facturar: datos.facturar ?? true,
        habilitado: datos.habilitado ?? true,
        orden: (maxOrden._max.orden ?? 0) + 1,
      },
    });
    return this.mapear(creada);
  }

  async actualizar(id: string, datos: ActualizarFormaPagoDto): Promise<FormaPagoApi> {
    const existente = await this.obtenerOError(id);
    const nombre = datos.nombre.trim();
    if (!nombre) {
      throw new BadRequestException('El nombre de la forma de pago es obligatorio.');
    }

    const actualizada = await this.prisma.formaPago.update({
      where: { id },
      data: {
        nombre,
        facturar: datos.facturar,
        habilitado: datos.habilitado,
        orden: datos.orden ?? existente.orden,
      },
    });
    return this.mapear(actualizada);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.obtenerOError(id);
    if (existente.codigo === CODIGO_FORMA_PAGO_CUENTA_CORRIENTE) {
      throw new ConflictException('No se puede eliminar la forma de pago de cuenta corriente.');
    }

    const ventas = await this.prisma.venta.count({
      where: { formaPago: existente.codigo },
    });
    if (ventas > 0) {
      throw new ConflictException(
        'No se puede eliminar la forma de pago porque tiene ventas asociadas.',
      );
    }

    await this.prisma.formaPago.update({
      where: { id },
      data: datosMarcarBorrado(),
    });
  }

  private async obtenerOError(id: string) {
    const forma = await this.prisma.formaPago.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!forma) throw new NotFoundException('Forma de pago no encontrada.');
    return forma;
  }

  private async resolverCodigoUnico(base: string): Promise<string> {
    let candidato = base;
    let sufijo = 2;
    while (
      await this.prisma.formaPago.findFirst({
        where: { codigo: candidato },
      })
    ) {
      const sufijoTexto = `_${sufijo}`;
      candidato = `${base.slice(0, Math.max(2, 30 - sufijoTexto.length))}${sufijoTexto}`;
      sufijo += 1;
    }
    return candidato;
  }
}
