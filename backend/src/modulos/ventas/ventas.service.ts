import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CondicionIvaCliente, FormaPagoVenta, Prisma } from '@prisma/client';
import {
  CODIGO_ESTADO_FACTURACION_FACTURADA,
  ID_ESTADO_FACTURACION_PENDIENTE,
} from '../../comunes/constantes/estados-facturacion';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { siguienteNumeroComprobante } from '../../comunes/utilidades/numero-comprobante';
import {
  redondearMoneda,
  validarLineasYTotalComprobante,
} from '../../comunes/utilidades/validar-totales-comprobante';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { CuentaCorrienteService } from '../cuenta-corriente/cuenta-corriente.service';
import { StockService } from '../stock/stock.service';
import { CargarFacturacionesDto } from './dto/cargar-facturaciones.dto';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';

export interface LineaVentaApi {
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface EstadoFacturacionApi {
  id: string;
  codigo: string;
  nombre: string;
}

export interface VentaRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar: string;
  condicionIvaCliente: string;
  formaPago: string;
  subtotal: number;
  ajusteMonto: number;
  ajustePorcentaje: number | null;
  total: number;
  facturacion: string;
  estadoFacturacion: EstadoFacturacionApi;
  lineas: LineaVentaApi[];
  observaciones: string;
}

type VentaConRelaciones = Prisma.VentaGetPayload<{
  include: { lineas: true; estadoFacturacion: true };
}>;

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
    private readonly stockService: StockService,
    private readonly cuentaCorrienteService: CuentaCorrienteService,
  ) {}

  async listar(): Promise<VentaRegistradaApi[]> {
    const ventas = await this.prisma.venta.findMany({
      include: { lineas: true, estadoFacturacion: true },
      orderBy: { fecha: 'desc' },
    });
    return ventas.map((v) => this.mapearVenta(v));
  }

  async obtenerPorId(id: string): Promise<VentaRegistradaApi> {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { lineas: true, estadoFacturacion: true },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    return this.mapearVenta(venta);
  }

  async cargarFacturaciones(datos: CargarFacturacionesDto): Promise<VentaRegistradaApi[]> {
    const estadoFacturada = await this.prisma.estadoFacturacion.findUnique({
      where: { codigo: CODIGO_ESTADO_FACTURACION_FACTURADA },
    });
    if (!estadoFacturada) {
      throw new ConflictException('No está configurado el estado «Facturada» en el sistema.');
    }

    const numerosVenta = datos.items.map((item) => item.numeroVenta.trim());
    const duplicados = numerosVenta.filter((numero, indice) => numerosVenta.indexOf(numero) !== indice);
    if (duplicados.length > 0) {
      throw new BadRequestException(
        `Hay números de venta repetidos en el archivo: ${[...new Set(duplicados)].join(', ')}.`,
      );
    }

    const actualizadas = await this.prisma.$transaction(async (tx) => {
      const resultados: VentaConRelaciones[] = [];

      for (const item of datos.items) {
        const numeroVenta = item.numeroVenta.trim();
        const facturacion = item.facturacion.trim();
        if (!numeroVenta || !facturacion) {
          throw new BadRequestException('Cada ítem debe incluir número de venta y facturación.');
        }

        const venta = await tx.venta.findUnique({
          where: { numero: numeroVenta },
          include: { lineas: true, estadoFacturacion: true },
        });
        if (!venta) {
          throw new NotFoundException(`No se encontró la venta ${numeroVenta}.`);
        }

        const actualizada = await tx.venta.update({
          where: { id: venta.id },
          data: {
            facturacion,
            estadoFacturacionId: estadoFacturada.id,
          },
          include: { lineas: true, estadoFacturacion: true },
        });
        resultados.push(actualizada);
      }

      return resultados;
    });

    return actualizadas.map((venta) => this.mapearVenta(venta));
  }

  async registrar(datos: RegistrarVentaDto, operador: UsuarioSesion): Promise<VentaRegistradaApi> {
    const ajusteMonto = datos.ajusteMonto ?? 0;
    const { lineasNormalizadas, subtotalLineas, totalCalculado } = validarLineasYTotalComprobante(
      datos.lineas.map((ln) => ({
        cantidad: ln.cantidad,
        precioUnitario: ln.precioUnitario,
        subtotal: ln.subtotal,
      })),
      datos.total,
      'precio unitario',
      ajusteMonto,
    );

    let documentoClienteMostrar = datos.documentoClienteMostrar?.trim() ?? '';
    let condicionIvaCliente: CondicionIvaCliente = CondicionIvaCliente.CONSUMIDOR_FINAL;
    let limiteCompraCuentaCorriente = 0;

    if (datos.formaPago === FormaPagoVenta.CUENTA_CORRIENTE) {
      if (!datos.clienteId) {
        throw new BadRequestException('La venta en cuenta corriente requiere un cliente.');
      }
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: datos.clienteId, ...filtroNoBorrado },
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado.');
      if (!cliente.cuentaCorrienteHabilitada) {
        throw new ConflictException('El cliente no tiene cuenta corriente habilitada.');
      }
      if (!cliente.habilitado) {
        throw new ConflictException('El cliente no está habilitado para operar.');
      }
      documentoClienteMostrar = cliente.documento;
      condicionIvaCliente = cliente.condicionIva;
      limiteCompraCuentaCorriente = decimalANumero(cliente.limiteCompraCuentaCorriente);
    } else if (datos.clienteId) {
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: datos.clienteId, ...filtroNoBorrado },
      });
      if (cliente) {
        documentoClienteMostrar = cliente.documento;
        condicionIvaCliente = cliente.condicionIva;
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

      if (datos.formaPago === FormaPagoVenta.CUENTA_CORRIENTE && datos.clienteId) {
        await this.cuentaCorrienteService.validarCreditoDisponibleParaCargo(
          datos.clienteId,
          totalCalculado,
          limiteCompraCuentaCorriente,
          tx,
        );
      }

      const ultima = await tx.venta.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = siguienteNumeroComprobante('V', ultima?.numero ?? null);
      const idVenta = await this.idSecuencia.siguienteVenta(tx);
      const idsLineas = await this.idSecuencia.siguientesVentaLinea(datos.lineas.length, tx);

      const creada = await tx.venta.create({
        data: {
          id: idVenta,
          numero,
          clienteId: datos.clienteId ?? null,
          nombreClienteMostrar: datos.nombreClienteMostrar.trim(),
          documentoClienteMostrar,
          condicionIvaCliente,
          formaPago: datos.formaPago,
          subtotal: new Prisma.Decimal(subtotalLineas),
          ajusteMonto: new Prisma.Decimal(redondearMoneda(ajusteMonto)),
          ajustePorcentaje:
            datos.ajustePorcentaje != null
              ? new Prisma.Decimal(datos.ajustePorcentaje)
              : null,
          total: new Prisma.Decimal(totalCalculado),
          observaciones: datos.observaciones?.trim() ?? '',
          estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
          lineas: {
            create: datos.lineas.map((ln, indice) => ({
              id: idsLineas[indice],
              varianteId: ln.varianteId,
              nombre: ln.nombre.trim(),
              cantidad: ln.cantidad,
              precioUnitario: new Prisma.Decimal(lineasNormalizadas[indice].precioUnitario),
              subtotal: new Prisma.Decimal(lineasNormalizadas[indice].subtotal),
            })),
          },
        },
        include: { lineas: true, estadoFacturacion: true },
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
            importe: totalCalculado,
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

  private mapearVenta(venta: VentaConRelaciones): VentaRegistradaApi {
    return {
      id: venta.id,
      numero: venta.numero,
      fecha: venta.fecha.toISOString(),
      clienteId: venta.clienteId,
      nombreClienteMostrar: venta.nombreClienteMostrar,
      documentoClienteMostrar: venta.documentoClienteMostrar,
      condicionIvaCliente: venta.condicionIvaCliente,
      formaPago: venta.formaPago,
      subtotal: decimalANumero(venta.subtotal),
      ajusteMonto: decimalANumero(venta.ajusteMonto),
      ajustePorcentaje: venta.ajustePorcentaje != null ? decimalANumero(venta.ajustePorcentaje) : null,
      total: decimalANumero(venta.total),
      facturacion: venta.facturacion,
      estadoFacturacion: {
        id: venta.estadoFacturacion.id,
        codigo: venta.estadoFacturacion.codigo,
        nombre: venta.estadoFacturacion.nombre,
      },
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
