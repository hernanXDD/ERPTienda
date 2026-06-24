import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormaPagoVenta, Prisma } from '@prisma/client';
import { ID_CONFIGURACION_SISTEMA } from '../../comunes/constantes/id-configuracion-sistema';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { siguienteNumeroComprobante } from '../../comunes/utilidades/numero-comprobante';
import { ventaDentroPlazoDevolucion } from '../../comunes/utilidades/plazo-devolucion';
import { subtotalEfectivoLineaDevolucion } from '../../comunes/utilidades/reembolso-devolucion-venta';
import { redondearMoneda } from '../../comunes/utilidades/validar-totales-comprobante';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CuentaCorrienteService } from '../cuenta-corriente/cuenta-corriente.service';
import { StockService } from '../stock/stock.service';
import type { LineaDevolucionDto, RegistrarDevolucionDto } from './dto/registrar-devolucion.dto';
import { agruparLineasDevolucion } from './utilidades/agrupar-lineas-devolucion';

export interface LineaDevolucionApi {
  id: string;
  ventaLineaId: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DevolucionRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  ventaId: string;
  numeroVenta: string;
  nombreClienteMostrar: string;
  total: number;
  observaciones: string;
  lineas: LineaDevolucionApi[];
}

type VentaConLineas = Prisma.VentaGetPayload<{ include: { lineas: true } }>;

type LineaDevolucionProcesada = {
  ventaLineaId: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

@Injectable()
export class DevolucionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
    private readonly stockService: StockService,
    private readonly cuentaCorrienteService: CuentaCorrienteService,
  ) {}

  async listarPorVenta(ventaId: string): Promise<DevolucionRegistradaApi[]> {
    const devoluciones = await this.prisma.devolucion.findMany({
      where: { ventaId },
      include: { lineas: true, venta: { select: { numero: true, nombreClienteMostrar: true } } },
      orderBy: { fecha: 'desc' },
    });
    return devoluciones.map((d) =>
      this.mapearDevolucion(d, d.venta.numero, d.venta.nombreClienteMostrar),
    );
  }

  async listar(): Promise<DevolucionRegistradaApi[]> {
    const devoluciones = await this.prisma.devolucion.findMany({
      include: {
        lineas: true,
        venta: { select: { numero: true, nombreClienteMostrar: true } },
      },
      orderBy: { fecha: 'desc' },
    });
    return devoluciones.map((d) =>
      this.mapearDevolucion(d, d.venta.numero, d.venta.nombreClienteMostrar),
    );
  }

  async registrar(datos: RegistrarDevolucionDto, operador: UsuarioSesion): Promise<DevolucionRegistradaApi> {
    const lineasSolicitadas = agruparLineasDevolucion(datos.lineas);

    const venta = await this.prisma.venta.findUnique({
      where: { id: datos.ventaId },
      include: { lineas: true },
    });
    if (!venta) {
      throw new NotFoundException('No encontramos la venta seleccionada. Actualizá el listado e intentá de nuevo.');
    }

    const config = await this.prisma.configuracionSistema.findUnique({
      where: { id: ID_CONFIGURACION_SISTEMA },
    });
    const diasPlazo = config?.diasPlazoDevolucion ?? 30;
    if (!ventaDentroPlazoDevolucion(venta.fecha, diasPlazo)) {
      throw new ConflictException(
        `Esta venta ya no admite devoluciones: superó el plazo de ${diasPlazo} ${diasPlazo === 1 ? 'día' : 'días'}.`,
      );
    }

    const montosVenta = {
      subtotal: decimalANumero(venta.subtotal),
      total: decimalANumero(venta.total),
    };

    const devolucion = await this.prisma.$transaction(async (tx) => {
      const lineasProcesadas = await this.procesarLineasDevolucion(
        tx,
        venta,
        montosVenta,
        lineasSolicitadas,
      );

      const totalDevolucion = redondearMoneda(
        lineasProcesadas.reduce((acum, ln) => acum + ln.subtotal, 0),
      );

      const ultima = await tx.devolucion.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = siguienteNumeroComprobante('D', ultima?.numero ?? null);
      const idDevolucion = await this.idSecuencia.siguienteDevolucion(tx);
      const idsLineas = await this.idSecuencia.siguientesDevolucionLinea(lineasProcesadas.length, tx);

      const creada = await tx.devolucion.create({
        data: {
          id: idDevolucion,
          numero,
          ventaId: venta.id,
          total: new Prisma.Decimal(totalDevolucion),
          observaciones: datos.observaciones?.trim() ?? '',
          registradoPorUsuarioId: operador.id,
          lineas: {
            create: lineasProcesadas.map((ln, indice) => ({
              id: idsLineas[indice],
              ventaLineaId: ln.ventaLineaId,
              varianteId: ln.varianteId,
              nombre: ln.nombre,
              cantidad: ln.cantidad,
              precioUnitario: new Prisma.Decimal(ln.precioUnitario),
              subtotal: new Prisma.Decimal(ln.subtotal),
            })),
          },
        },
        include: { lineas: true },
      });

      await this.stockService.aplicarEntradaPorDevolucion(
        tx,
        lineasProcesadas.map((ln) => ({
          varianteId: ln.varianteId,
          nombre: ln.nombre,
          cantidad: ln.cantidad,
        })),
        creada.id,
        numero,
        venta.id,
        venta.numero,
        operador.id,
      );

      if (venta.formaPago === FormaPagoVenta.CUENTA_CORRIENTE && venta.clienteId) {
        await this.cuentaCorrienteService.registrarCreditoPorDevolucion(
          venta.clienteId,
          totalDevolucion,
          `Devolución ${numero} · Venta ${venta.numero}`,
          operador.id,
          tx,
        );
      }

      return creada;
    });

    return this.mapearDevolucion(devolucion, venta.numero, venta.nombreClienteMostrar);
  }

  async obtenerCantidadesDevueltasPorLinea(
    ventaId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Map<string, number>> {
    const filas = await tx.devolucionLinea.findMany({
      where: { ventaLinea: { ventaId } },
      select: { ventaLineaId: true, cantidad: true },
    });
    const mapa = new Map<string, number>();
    for (const fila of filas) {
      mapa.set(fila.ventaLineaId, (mapa.get(fila.ventaLineaId) ?? 0) + fila.cantidad);
    }
    return mapa;
  }

  private async procesarLineasDevolucion(
    tx: Prisma.TransactionClient,
    venta: VentaConLineas,
    montosVenta: { subtotal: number; total: number },
    solicitudes: LineaDevolucionDto[],
  ): Promise<LineaDevolucionProcesada[]> {
    const mapaLineas = new Map(venta.lineas.map((ln) => [ln.id, ln]));
    const cantidadesDevueltas = await this.obtenerCantidadesDevueltasPorLinea(venta.id, tx);

    const lineasProcesadas: LineaDevolucionProcesada[] = [];

    for (const solicitud of solicitudes) {
      const linea = mapaLineas.get(solicitud.ventaLineaId);
      if (!linea) {
        throw new BadRequestException(
          'Una de las prendas seleccionadas no corresponde a la venta indicada.',
        );
      }
      const yaDevuelto = cantidadesDevueltas.get(solicitud.ventaLineaId) ?? 0;
      const disponible = linea.cantidad - yaDevuelto;
      if (solicitud.cantidad > disponible) {
        throw new ConflictException(
          `Cantidad inválida para «${linea.nombre}»: podés devolver hasta ${disponible} ${disponible === 1 ? 'unidad' : 'unidades'} (pediste ${solicitud.cantidad}).`,
        );
      }
      const precioUnitario = decimalANumero(linea.precioUnitario);
      const subtotal = subtotalEfectivoLineaDevolucion(
        montosVenta,
        solicitud.cantidad,
        precioUnitario,
      );
      lineasProcesadas.push({
        ventaLineaId: linea.id,
        varianteId: linea.varianteId,
        nombre: linea.nombre,
        cantidad: solicitud.cantidad,
        precioUnitario,
        subtotal,
      });
    }

    if (lineasProcesadas.length === 0) {
      throw new BadRequestException('Seleccioná al menos una prenda con cantidad mayor a cero.');
    }

    return lineasProcesadas;
  }

  private mapearDevolucion(
    devolucion: Prisma.DevolucionGetPayload<{ include: { lineas: true } }>,
    numeroVenta: string,
    nombreClienteMostrar = '',
  ): DevolucionRegistradaApi {
    return {
      id: devolucion.id,
      numero: devolucion.numero,
      fecha: devolucion.fecha.toISOString(),
      ventaId: devolucion.ventaId,
      numeroVenta,
      nombreClienteMostrar,
      total: decimalANumero(devolucion.total),
      observaciones: devolucion.observaciones,
      lineas: devolucion.lineas.map((ln) => ({
        id: ln.id,
        ventaLineaId: ln.ventaLineaId,
        varianteId: ln.varianteId,
        nombre: ln.nombre,
        cantidad: ln.cantidad,
        precioUnitario: decimalANumero(ln.precioUnitario),
        subtotal: decimalANumero(ln.subtotal),
      })),
    };
  }
}
