import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CondicionIvaCliente, Prisma } from '@prisma/client';
import {
  CODIGO_ESTADO_FACTURACION_FACTURADA,
  ID_ESTADO_FACTURACION_PENDIENTE,
} from '../../comunes/constantes/estados-facturacion';
import { esFormaPagoCuentaCorriente } from '../../comunes/constantes/forma-pago';
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
import { CuponesDescuentoService } from '../cupones-descuento/cupones-descuento.service';
import { FormasPagoService } from '../formas-pago/formas-pago.service';
import { StockService } from '../stock/stock.service';
import { CargarFacturacionesDto } from './dto/cargar-facturaciones.dto';
import { RegistrarVentaDto } from './dto/registrar-venta.dto';

export interface LineaVentaApi {
  id: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  cantidadDevuelta: number;
  cantidadDisponibleDevolver: number;
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
    private readonly cuponesDescuentoService: CuponesDescuentoService,
    private readonly formasPagoService: FormasPagoService,
  ) {}

  async listar(): Promise<VentaRegistradaApi[]> {
    const ventas = await this.prisma.venta.findMany({
      include: { lineas: true, estadoFacturacion: true },
      orderBy: { fecha: 'desc' },
    });
    const mapaDevuelto = await this.mapaCantidadesDevueltasPorLinea(ventas.map((v) => v.id));
    return ventas.map((v) => this.mapearVenta(v, mapaDevuelto));
  }

  async obtenerPorId(id: string): Promise<VentaRegistradaApi> {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { lineas: true, estadoFacturacion: true },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada.');
    const mapaDevuelto = await this.mapaCantidadesDevueltasPorLinea([venta.id]);
    return this.mapearVenta(venta, mapaDevuelto);
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

    const mapaDevuelto = await this.mapaCantidadesDevueltasPorLinea(actualizadas.map((v) => v.id));
    return actualizadas.map((venta) => this.mapearVenta(venta, mapaDevuelto));
  }

  async registrar(datos: RegistrarVentaDto, operador: UsuarioSesion): Promise<VentaRegistradaApi> {
    const formaPago = datos.formaPago.trim().toUpperCase();
    await this.formasPagoService.validarCodigoParaVenta(formaPago);

    const ajusteMonto = datos.ajusteMonto ?? 0;
    const cuponDescuentoId = datos.cuponDescuentoId?.trim() || null;

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

    if (cuponDescuentoId) {
      if (ajusteMonto >= 0) {
        throw new BadRequestException('Un cupón de descuento requiere un ajuste negativo en el ticket.');
      }
      await this.cuponesDescuentoService.verificarAjusteEnVenta(
        cuponDescuentoId,
        subtotalLineas,
        ajusteMonto,
        datos.ajustePorcentaje,
        datos.clienteId ?? null,
      );
    }

    let documentoClienteMostrar = datos.documentoClienteMostrar?.trim() ?? '';
    let condicionIvaCliente: CondicionIvaCliente = CondicionIvaCliente.CONSUMIDOR_FINAL;
    let limiteCompraCuentaCorriente = 0;

    if (esFormaPagoCuentaCorriente(formaPago)) {
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
      const lineasStock = datos.lineas.map((ln) => ({
        varianteId: ln.varianteId,
        nombre: ln.nombre.trim(),
        cantidad: ln.cantidad,
      }));

      const faltas = await this.stockService.validarStockBloqueadoParaVenta(tx, lineasStock);
      if (faltas) {
        throw new ConflictException('Stock insuficiente para completar la venta.');
      }

      if (esFormaPagoCuentaCorriente(formaPago) && datos.clienteId) {
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
          formaPago,
          subtotal: new Prisma.Decimal(subtotalLineas),
          ajusteMonto: new Prisma.Decimal(redondearMoneda(ajusteMonto)),
          ajustePorcentaje:
            datos.ajustePorcentaje != null
              ? new Prisma.Decimal(datos.ajustePorcentaje)
              : null,
          total: new Prisma.Decimal(totalCalculado),
          observaciones: datos.observaciones?.trim() ?? '',
          estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
          cuponDescuentoId: cuponDescuentoId ?? undefined,
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

      if (esFormaPagoCuentaCorriente(formaPago) && datos.clienteId) {
        await this.cuentaCorrienteService.registrarCargo(
          datos.clienteId,
          {
            importe: totalCalculado,
            descripcion: `Venta ${numero}`,
          },
          operador.id,
          tx,
          { ventaId: creada.id },
        );
      }

      if (cuponDescuentoId) {
        await this.cuponesDescuentoService.consumirEnVenta(
          cuponDescuentoId,
          datos.clienteId ?? null,
          tx,
        );
      }

      return creada;
    });

    return this.mapearVenta(venta, new Map());
  }

  private async mapaCantidadesDevueltasPorLinea(ventaIds: string[]): Promise<Map<string, number>> {
    if (ventaIds.length === 0) return new Map();
    const filas = await this.prisma.devolucionLinea.findMany({
      where: { ventaLinea: { ventaId: { in: ventaIds } } },
      select: { ventaLineaId: true, cantidad: true },
    });
    const mapa = new Map<string, number>();
    for (const fila of filas) {
      mapa.set(fila.ventaLineaId, (mapa.get(fila.ventaLineaId) ?? 0) + fila.cantidad);
    }
    return mapa;
  }

  private mapearVenta(
    venta: VentaConRelaciones,
    cantidadesDevueltas: Map<string, number>,
  ): VentaRegistradaApi {
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
      lineas: venta.lineas.map((ln) => {
        const cantidadDevuelta = cantidadesDevueltas.get(ln.id) ?? 0;
        return {
          id: ln.id,
          varianteId: ln.varianteId,
          nombre: ln.nombre,
          cantidad: ln.cantidad,
          cantidadDevuelta,
          cantidadDisponibleDevolver: Math.max(0, ln.cantidad - cantidadDevuelta),
          precioUnitario: decimalANumero(ln.precioUnitario),
          subtotal: decimalANumero(ln.subtotal),
        };
      }),
    };
  }
}
