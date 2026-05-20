import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormaPagoVenta, Prisma } from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { siguienteNumeroComprobante } from '../../comunes/utilidades/numero-comprobante';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { PrismaService } from '../../prisma/prisma.service';
import { CuentaCorrienteService } from '../cuenta-corriente/cuenta-corriente.service';
import { StockService } from '../stock/stock.service';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';

export interface LineaVentaApi {
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  clienteId: string | null;
  nombreClienteMostrar: string;
  formaPago: string;
  total: number;
  lineas: LineaVentaApi[];
  observaciones: string;
}

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly cuentaCorrienteService: CuentaCorrienteService,
  ) {}

  async listar(): Promise<VentaRegistradaApi[]> {
    const ventas = await this.prisma.venta.findMany({
      include: { lineas: true },
      orderBy: { fecha: 'desc' },
    });
    return ventas.map((v) => this.mapearVenta(v));
  }

  async obtenerPorId(id: string): Promise<VentaRegistradaApi> {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { lineas: true },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    return this.mapearVenta(venta);
  }

  async registrar(datos: RegistrarVentaDto, operador: UsuarioSesion): Promise<VentaRegistradaApi> {
    if (datos.formaPago === FormaPagoVenta.CUENTA_CORRIENTE) {
      if (!datos.clienteId) {
        throw new BadRequestException('La venta en cuenta corriente requiere un cliente.');
      }
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: datos.clienteId, fechaEliminacion: null },
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado.');
      if (!cliente.cuentaCorrienteHabilitada) {
        throw new ConflictException('El cliente no tiene cuenta corriente habilitada.');
      }
      if (!cliente.habilitado) {
        throw new ConflictException('El cliente no está habilitado para operar.');
      }
    }

    const venta = await this.prisma.$transaction(async (tx) => {
      const cantidades = new Map<string, number>();
      for (const ln of datos.lineas) {
        const cantidad = await this.stockService.obtenerCantidad(ln.varianteId, tx);
        cantidades.set(ln.varianteId, cantidad);
      }

      const faltas = this.stockService.validarStockParaVenta(
        datos.lineas.map((ln) => ({
          varianteId: ln.varianteId,
          nombre: ln.nombre,
          cantidad: ln.cantidad,
        })),
        cantidades,
      );
      if (faltas) {
        throw new ConflictException('Stock insuficiente para completar la venta.');
      }

      const ultima = await tx.venta.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = siguienteNumeroComprobante('V', ultima?.numero ?? null);

      const creada = await tx.venta.create({
        data: {
          numero,
          clienteId: datos.clienteId ?? null,
          nombreClienteMostrar: datos.nombreClienteMostrar.trim(),
          formaPago: datos.formaPago,
          total: new Prisma.Decimal(datos.total),
          observaciones: datos.observaciones?.trim() ?? '',
          lineas: {
            create: datos.lineas.map((ln) => ({
              varianteId: ln.varianteId,
              nombre: ln.nombre.trim(),
              cantidad: ln.cantidad,
              precioUnitario: new Prisma.Decimal(ln.precioUnitario),
              subtotal: new Prisma.Decimal(ln.subtotal),
            })),
          },
        },
        include: { lineas: true },
      });

      await this.stockService.aplicarSalidaPorVenta(
        tx,
        datos.lineas.map((ln) => ({
          varianteId: ln.varianteId,
          nombre: ln.nombre.trim(),
          cantidad: ln.cantidad,
        })),
        creada.id,
        numero,
        operador.id,
      );

      if (datos.formaPago === FormaPagoVenta.CUENTA_CORRIENTE && datos.clienteId) {
        await this.cuentaCorrienteService.registrarCargo(
          datos.clienteId,
          {
            importe: datos.total,
            descripcion: `Venta ${numero}`,
          },
          operador.id,
          tx,
        );
      }

      return creada;
    });

    return this.mapearVenta(venta);
  }

  private mapearVenta(venta: {
    id: string;
    numero: string;
    fecha: Date;
    clienteId: string | null;
    nombreClienteMostrar: string;
    formaPago: string;
    total: Prisma.Decimal;
    observaciones: string;
    lineas: Array<{
      varianteId: string;
      nombre: string;
      cantidad: number;
      precioUnitario: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }>;
  }): VentaRegistradaApi {
    return {
      id: venta.id,
      numero: venta.numero,
      fecha: venta.fecha.toISOString(),
      clienteId: venta.clienteId,
      nombreClienteMostrar: venta.nombreClienteMostrar,
      formaPago: venta.formaPago,
      total: decimalANumero(venta.total),
      observaciones: venta.observaciones,
      lineas: venta.lineas.map((ln) => ({
        varianteId: ln.varianteId,
        nombre: ln.nombre,
        cantidad: ln.cantidad,
        precioUnitario: decimalANumero(ln.precioUnitario),
        subtotal: decimalANumero(ln.subtotal),
      })),
    };
  }
}
