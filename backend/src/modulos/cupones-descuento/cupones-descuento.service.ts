import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoCuponDescuento, Prisma, TipoDescuentoCupon } from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { siguienteNumeroComprobante } from '../../comunes/utilidades/numero-comprobante';
import {
  TOLERANCIA_MONEDA,
  redondearMoneda,
} from '../../comunes/utilidades/validar-totales-comprobante';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearCuponDescuentoDto } from './dto/crear-cupon-descuento.dto';
import { AnularCuponDescuentoDto } from './dto/anular-cupon-descuento.dto';
import { generarCodigoCuponUnico } from './utilidades/generar-codigo-cupon';

const LISTADO_CUPON_INCLUDE = {
  devolucion: {
    select: {
      id: true,
      numero: true,
      ventaId: true,
      venta: { select: { id: true, numero: true } },
    },
  },
  ventaUsada: { select: { id: true, numero: true } },
} as const;

type CuponConTrazabilidad = Prisma.CuponDescuentoGetPayload<{
  include: typeof LISTADO_CUPON_INCLUDE;
}>;

export interface CuponDescuentoListadoApi {
  id: string;
  numero: string;
  tipoDescuento: string;
  porcentajeDescuento: number | null;
  montoDescuento: number | null;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar: string;
  estado: string;
  devolucionId: string | null;
  numeroDevolucion: string | null;
  ventaOrigenId: string | null;
  numeroVentaOrigen: string | null;
  ventaUsadaId: string | null;
  numeroVentaUsada: string | null;
  observaciones: string;
  fecha: string;
  fechaVencimiento: string;
}

export interface CuponDescuentoCreadoApi extends CuponDescuentoListadoApi {
  /** Solo se devuelve al crear o al solicitar reimpresión del código de barras. */
  codigo: string;
}

type CuponPersistido = {
  id: string;
  numero: string;
  codigo: string;
  tipoDescuento: TipoDescuentoCupon;
  porcentajeDescuento: Prisma.Decimal | null;
  montoDescuento: Prisma.Decimal | null;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar: string;
  estado: string;
  devolucionId: string | null;
  observaciones: string;
  fechaCreacion: Date;
  fechaVencimiento: Date;
};

@Injectable()
export class CuponesDescuentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  async listar(): Promise<CuponDescuentoListadoApi[]> {
    const cupones = await this.prisma.cuponDescuento.findMany({
      orderBy: { fechaCreacion: 'desc' },
      include: LISTADO_CUPON_INCLUDE,
    });
    return cupones.map((c) => this.mapearListado(c));
  }

  async crear(datos: CrearCuponDescuentoDto, operador: UsuarioSesion): Promise<CuponDescuentoCreadoApi> {
    const tipoDescuento = datos.tipoDescuento ?? TipoDescuentoCupon.porcentaje;
    let porcentajeDescuento: number | null = null;
    let montoDescuento: number | null = null;

    if (tipoDescuento === TipoDescuentoCupon.porcentaje) {
      if (datos.porcentajeDescuento == null) {
        throw new BadRequestException('Indicá el porcentaje de descuento del cupón.');
      }
      porcentajeDescuento = Math.round(datos.porcentajeDescuento * 100) / 100;
      if (porcentajeDescuento <= 0 || porcentajeDescuento > 100) {
        throw new BadRequestException('El porcentaje de descuento debe estar entre 0,01 y 100.');
      }
    } else {
      if (datos.montoDescuento == null) {
        throw new BadRequestException('Indicá el monto de descuento del cupón.');
      }
      montoDescuento = redondearMoneda(datos.montoDescuento);
      if (montoDescuento <= 0) {
        throw new BadRequestException('El monto de descuento debe ser mayor a cero.');
      }
    }

    const fechaVencimiento = new Date(datos.fechaVencimiento);
    if (Number.isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('La fecha de vencimiento no es válida.');
    }
    const finDelDia = new Date(fechaVencimiento);
    finDelDia.setHours(23, 59, 59, 999);
    if (finDelDia.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha de vencimiento debe ser posterior a hoy.');
    }

    let nombreClienteMostrar = datos.nombreClienteMostrar?.trim() || 'Sin cliente asignado';
    let documentoClienteMostrar = datos.documentoClienteMostrar?.trim() ?? '';
    let clienteId: string | null = datos.clienteId ?? null;

    if (clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, habilitado: true, nombre: true, documento: true },
      });
      if (!cliente || !cliente.habilitado) {
        throw new BadRequestException('El cliente indicado no existe o no está habilitado.');
      }
      nombreClienteMostrar = cliente.nombre;
      documentoClienteMostrar = cliente.documento;
    }

    const cupon = await this.prisma.$transaction(async (tx) => {
      if (datos.devolucionId) {
        await this.validarDevolucionParaCupon(tx, datos.devolucionId, montoDescuento, clienteId);
      }

      const ultimo = await tx.cuponDescuento.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = siguienteNumeroComprobante('CD', ultimo?.numero ?? null);
      const codigo = await generarCodigoCuponUnico(tx);
      const id = await this.idSecuencia.siguienteCuponDescuento(tx);

      return tx.cuponDescuento.create({
        data: {
          id,
          numero,
          codigo,
          tipoDescuento,
          porcentajeDescuento:
            porcentajeDescuento != null ? new Prisma.Decimal(porcentajeDescuento) : null,
          montoDescuento: montoDescuento != null ? new Prisma.Decimal(montoDescuento) : null,
          clienteId: clienteId,
          nombreClienteMostrar,
          documentoClienteMostrar,
          devolucionId: datos.devolucionId ?? null,
          observaciones: datos.observaciones?.trim() ?? '',
          fechaVencimiento: finDelDia,
          registradoPorUsuarioId: operador.id,
        },
      });
    });

    const cuponCompleto = await this.prisma.cuponDescuento.findUniqueOrThrow({
      where: { id: cupon.id },
      include: LISTADO_CUPON_INCLUDE,
    });

    return this.mapearCreado(cuponCompleto);
  }

  async anular(id: string, datos: AnularCuponDescuentoDto): Promise<CuponDescuentoListadoApi> {
    const cupon = await this.prisma.cuponDescuento.findUnique({
      where: { id },
      include: LISTADO_CUPON_INCLUDE,
    });
    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado.');
    }
    if (cupon.estado !== EstadoCuponDescuento.activo) {
      throw new BadRequestException('Solo podés anular cupones que sigan activos.');
    }

    const motivo = datos.motivo?.trim();
    const observaciones = motivo
      ? [cupon.observaciones, `Anulado: ${motivo}`].filter(Boolean).join(' · ')
      : cupon.observaciones;

    const actualizado = await this.prisma.cuponDescuento.update({
      where: { id },
      data: {
        estado: EstadoCuponDescuento.anulado,
        observaciones,
      },
      include: LISTADO_CUPON_INCLUDE,
    });

    return this.mapearListado(actualizado);
  }

  async obtenerCodigoBarras(id: string): Promise<{ codigo: string }> {
    const cupon = await this.prisma.cuponDescuento.findUnique({
      where: { id },
      select: { codigo: true, estado: true },
    });
    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado.');
    }
    if (cupon.estado === 'anulado') {
      throw new BadRequestException('Este cupón fue anulado y no puede reimprimirse ni utilizarse.');
    }
    return { codigo: cupon.codigo };
  }

  async validarPorCodigo(
    codigo: string,
    clienteId?: string | null,
  ): Promise<CuponDescuentoListadoApi> {
    const codigoNorm = codigo.trim();
    if (!codigoNorm) {
      throw new BadRequestException('Ingresá el código del cupón.');
    }

    const cupon = await this.prisma.cuponDescuento.findUnique({
      where: { codigo: codigoNorm },
      include: LISTADO_CUPON_INCLUDE,
    });
    if (!cupon) {
      throw new NotFoundException('No encontramos un cupón con ese código. Revisá el escaneo e intentá de nuevo.');
    }

    this.verificarCuponDisponible(cupon, clienteId ?? null);
    return this.mapearListado(cupon);
  }

  async verificarAjusteEnVenta(
    cuponId: string,
    subtotalLineas: number,
    ajusteMonto: number,
    ajustePorcentaje: number | null | undefined,
    clienteId: string | null,
  ): Promise<void> {
    const cupon = await this.obtenerCuponActivoPorId(cuponId);
    this.verificarCuponDisponible(cupon, clienteId);

    const subtotalRedondeado = Math.round(subtotalLineas);

    if (cupon.tipoDescuento === TipoDescuentoCupon.porcentaje) {
      if (cupon.porcentajeDescuento == null) {
        throw new BadRequestException('El cupón no tiene un porcentaje de descuento válido.');
      }
      const porcentajeCupon = decimalANumero(cupon.porcentajeDescuento);
      if (ajustePorcentaje == null || Math.abs(ajustePorcentaje - porcentajeCupon) > 0.01) {
        throw new BadRequestException(
          'El descuento del ticket no coincide con el cupón escaneado. Quitá el cupón y volvé a aplicarlo.',
        );
      }
      const montoEsperado = -Math.min(
        Math.round(subtotalRedondeado * (porcentajeCupon / 100)),
        subtotalRedondeado,
      );
      if (Math.abs(ajusteMonto - montoEsperado) > TOLERANCIA_MONEDA) {
        throw new BadRequestException(
          'El monto de descuento del ticket no coincide con el cupón. Quitá el cupón y volvé a aplicarlo.',
        );
      }
      return;
    }

    if (cupon.montoDescuento == null) {
      throw new BadRequestException('El cupón no tiene un monto de descuento válido.');
    }
    if (ajustePorcentaje != null) {
      throw new BadRequestException('Un cupón de monto fijo no debe informar porcentaje de ajuste.');
    }
    const montoCupon = Math.round(decimalANumero(cupon.montoDescuento));
    const montoEsperado = -Math.min(montoCupon, subtotalRedondeado);
    if (Math.abs(ajusteMonto - montoEsperado) > TOLERANCIA_MONEDA) {
      throw new BadRequestException('El monto de descuento del cupón no coincide con el ticket.');
    }
  }

  async consumirEnVenta(
    cuponId: string,
    clienteId: string | null,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const cupon = await tx.cuponDescuento.findUnique({ where: { id: cuponId } });
    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado.');
    }
    this.verificarCuponDisponible(cupon, clienteId);

    await tx.cuponDescuento.update({
      where: { id: cuponId },
      data: { estado: EstadoCuponDescuento.usado },
    });
  }

  private async obtenerCuponActivoPorId(cuponId: string): Promise<CuponPersistido> {
    const cupon = await this.prisma.cuponDescuento.findUnique({ where: { id: cuponId } });
    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado.');
    }
    return cupon;
  }

  private async validarDevolucionParaCupon(
    tx: Prisma.TransactionClient,
    devolucionId: string,
    montoDescuento: number | null,
    clienteId: string | null,
  ): Promise<void> {
    const devolucion = await tx.devolucion.findUnique({
      where: { id: devolucionId },
      include: { venta: { select: { clienteId: true, nombreClienteMostrar: true, documentoClienteMostrar: true } } },
    });
    if (!devolucion) {
      throw new BadRequestException('La devolución indicada no existe o ya no está disponible.');
    }

    const cuponExistente = await tx.cuponDescuento.findFirst({
      where: {
        devolucionId,
        estado: { in: [EstadoCuponDescuento.activo, EstadoCuponDescuento.usado] },
      },
      select: { numero: true },
    });
    if (cuponExistente) {
      throw new ConflictException(
        `Esa devolución ya tiene un cupón emitido (${cuponExistente.numero}).`,
      );
    }

    if (montoDescuento != null) {
      const totalDevolucion = Math.round(decimalANumero(devolucion.total));
      if (montoDescuento > totalDevolucion) {
        throw new BadRequestException(
          `El monto del cupón no puede superar lo devuelto (${totalDevolucion.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}).`,
        );
      }
    }

    const venta = devolucion.venta;
    if (venta.clienteId && clienteId && clienteId !== venta.clienteId) {
      throw new BadRequestException(
        'Este cupón debe quedar asignado al mismo cliente de la venta original.',
      );
    }
  }

  private verificarCuponDisponible(cupon: CuponPersistido, clienteId: string | null): void {
    if (cupon.estado === EstadoCuponDescuento.usado) {
      throw new BadRequestException('Este cupón ya se usó en otra venta y no puede aplicarse de nuevo.');
    }
    if (cupon.estado === EstadoCuponDescuento.anulado) {
      throw new BadRequestException('Este cupón fue anulado y no puede utilizarse.');
    }
    if (cupon.fechaVencimiento.getTime() < Date.now()) {
      throw new BadRequestException('Este cupón venció y ya no puede utilizarse en caja.');
    }
    if (cupon.clienteId && cupon.clienteId !== clienteId) {
      throw new BadRequestException(
        'Este cupón está asignado a otro cliente. Verificá el cliente del ticket.',
      );
    }
  }

  private mapearListado(cupon: CuponConTrazabilidad | CuponPersistido): CuponDescuentoListadoApi {
    const conTrazabilidad = cupon as CuponConTrazabilidad;
    return {
      id: cupon.id,
      numero: cupon.numero,
      tipoDescuento: cupon.tipoDescuento,
      porcentajeDescuento:
        cupon.porcentajeDescuento != null ? decimalANumero(cupon.porcentajeDescuento) : null,
      montoDescuento: cupon.montoDescuento != null ? decimalANumero(cupon.montoDescuento) : null,
      clienteId: cupon.clienteId,
      nombreClienteMostrar: cupon.nombreClienteMostrar,
      documentoClienteMostrar: cupon.documentoClienteMostrar,
      estado: cupon.estado,
      devolucionId: cupon.devolucionId,
      numeroDevolucion: conTrazabilidad.devolucion?.numero ?? null,
      ventaOrigenId: conTrazabilidad.devolucion?.ventaId ?? null,
      numeroVentaOrigen: conTrazabilidad.devolucion?.venta?.numero ?? null,
      ventaUsadaId: conTrazabilidad.ventaUsada?.id ?? null,
      numeroVentaUsada: conTrazabilidad.ventaUsada?.numero ?? null,
      observaciones: cupon.observaciones,
      fecha: cupon.fechaCreacion.toISOString(),
      fechaVencimiento: cupon.fechaVencimiento.toISOString(),
    };
  }

  private mapearCreado(cupon: CuponConTrazabilidad | CuponPersistido): CuponDescuentoCreadoApi {
    return {
      ...this.mapearListado(cupon),
      codigo: cupon.codigo,
    };
  }
}
