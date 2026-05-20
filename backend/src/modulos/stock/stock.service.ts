import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MotivoMovimientoStock,
  Prisma,
} from '@prisma/client';
import { armarNombreLineaComercial } from '../../comunes/utilidades/nombre-linea-comercial';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { AjusteConteoDto } from './dto/ajuste-conteo.dto';
import { EntradaManualDto } from './dto/entrada-manual.dto';

export interface FaltaStockLineaApi {
  varianteId: string;
  nombre: string;
  solicitado: number;
  disponible: number;
}

export interface LineaVentaStock {
  varianteId: string;
  nombre: string;
  cantidad: number;
}

export interface MovimientoStockApi {
  id: string;
  fecha: string;
  varianteId: string;
  nombreVariante: string;
  motivo: MotivoMovimientoStock;
  cantidadVariacion: number;
  stockResultante: number;
  idVenta?: string | null;
  numeroVenta?: string | null;
  nota?: string | null;
  ejecutadoPorUsuario?: string | null;
}

export interface ResumenStockVarianteApi {
  varianteId: string;
  productoId: string;
  nombreProducto: string;
  marca: string;
  nombreCategoria: string;
  talle: string;
  color: string;
  codigoBarras: string;
  activa: boolean;
  cantidadActual: number;
  nombreLineaComercial: string;
}

type ClienteTx = Prisma.TransactionClient;

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogoService: CatalogoService,
  ) {}

  async obtenerCantidad(varianteId: string, tx?: ClienteTx): Promise<number> {
    const prisma = tx ?? this.prisma;
    const stock = await prisma.stockVariante.findUnique({ where: { varianteId } });
    return stock?.cantidadActual ?? 0;
  }

  async listarMovimientos(filtros: {
    varianteId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<MovimientoStockApi[]> {
    const where: Prisma.MovimientoStockWhereInput = {};
    if (filtros.varianteId) where.varianteId = filtros.varianteId;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha = {};
      if (filtros.fechaDesde) where.fecha.gte = filtros.fechaDesde;
      if (filtros.fechaHasta) where.fecha.lte = filtros.fechaHasta;
    }

    const movimientos = await this.prisma.movimientoStock.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 400,
      include: { ejecutadoPorUsuario: { select: { nombreUsuario: true } } },
    });

    return movimientos.map((m) => ({
      id: m.id,
      fecha: m.fecha.toISOString(),
      varianteId: m.varianteId,
      nombreVariante: m.nombreVariante,
      motivo: m.motivo,
      cantidadVariacion: m.cantidadVariacion,
      stockResultante: m.stockResultante,
      idVenta: m.ventaId,
      numeroVenta: m.numeroVenta,
      nota: m.nota,
      ejecutadoPorUsuario: m.ejecutadoPorUsuario?.nombreUsuario ?? null,
    }));
  }

  async obtenerResumen(): Promise<ResumenStockVarianteApi[]> {
    const filas = await this.prisma.stockVariante.findMany({
      include: {
        variante: {
          include: {
            producto: { include: { categoria: true } },
          },
        },
      },
      orderBy: { variante: { producto: { nombre: 'asc' } } },
    });

    const resumen: ResumenStockVarianteApi[] = [];
    for (const fila of filas) {
      const { variante } = fila;
      if (variante.producto.fechaEliminacion) continue;
      resumen.push({
        varianteId: variante.id,
        productoId: variante.productoId,
        nombreProducto: variante.producto.nombre,
        marca: variante.producto.marca,
        nombreCategoria: variante.producto.categoria.nombre,
        talle: variante.talle,
        color: variante.color,
        codigoBarras: variante.codigoBarras,
        activa: variante.activa,
        cantidadActual: fila.cantidadActual,
        nombreLineaComercial: armarNombreLineaComercial(
          variante.producto.nombre,
          variante.talle,
          variante.color,
        ),
      });
    }
    return resumen;
  }

  validarStockParaVenta(
    lineas: LineaVentaStock[],
    cantidades: Map<string, number>,
  ): FaltaStockLineaApi[] | null {
    const faltas: FaltaStockLineaApi[] = [];
    for (const ln of lineas) {
      const disponible = cantidades.get(ln.varianteId) ?? 0;
      if (disponible < ln.cantidad) {
        faltas.push({
          varianteId: ln.varianteId,
          nombre: ln.nombre,
          solicitado: ln.cantidad,
          disponible,
        });
      }
    }
    return faltas.length > 0 ? faltas : null;
  }

  async aplicarSalidaPorVenta(
    tx: ClienteTx,
    lineas: LineaVentaStock[],
    ventaId: string,
    numeroVenta: string,
    ejecutadoPorUsuarioId: string | null,
  ): Promise<void> {
    for (const ln of lineas) {
      const stock = await tx.stockVariante.findUnique({ where: { varianteId: ln.varianteId } });
      if (!stock) throw new NotFoundException(`Sin stock para variante ${ln.varianteId}.`);
      const nuevo = stock.cantidadActual - ln.cantidad;
      await tx.stockVariante.update({
        where: { varianteId: ln.varianteId },
        data: { cantidadActual: nuevo },
      });
      await tx.movimientoStock.create({
        data: {
          varianteId: ln.varianteId,
          nombreVariante: ln.nombre,
          motivo: MotivoMovimientoStock.salidaPorVenta,
          cantidadVariacion: -ln.cantidad,
          stockResultante: nuevo,
          ventaId,
          numeroVenta,
          ejecutadoPorUsuarioId,
        },
      });
    }
  }

  async aplicarEntradaPorCompra(
    tx: ClienteTx,
    varianteId: string,
    nombreVariante: string,
    cantidad: number,
    ejecutadoPorUsuarioId: string | null,
    nota?: string,
  ): Promise<void> {
    const unidades = Math.floor(cantidad);
    if (!Number.isFinite(unidades) || unidades <= 0) return;

    await this.asegurarStockVariante(tx, varianteId);
    const stock = await tx.stockVariante.findUniqueOrThrow({ where: { varianteId } });
    const nuevo = stock.cantidadActual + unidades;
    await tx.stockVariante.update({
      where: { varianteId },
      data: { cantidadActual: nuevo },
    });
    await tx.movimientoStock.create({
      data: {
        varianteId,
        nombreVariante,
        motivo: MotivoMovimientoStock.entradaPorCompra,
        cantidadVariacion: unidades,
        stockResultante: nuevo,
        nota: nota ?? null,
        ejecutadoPorUsuarioId,
      },
    });
  }

  async aplicarAjustePorConteo(
    datos: AjusteConteoDto,
    ejecutadoPorUsuarioId: string,
  ): Promise<{ anterior: number; nuevo: number; delta: number }> {
    const nombreVariante = await this.catalogoService.nombreLineaComercial(datos.varianteId);
    await this.validarVariante(datos.varianteId);

    return this.prisma.$transaction(async (tx) => {
      await this.asegurarStockVariante(tx, datos.varianteId);
      const stock = await tx.stockVariante.findUniqueOrThrow({
        where: { varianteId: datos.varianteId },
      });
      const anterior = stock.cantidadActual;
      const nuevo = datos.cantidadFisicaContada;
      const delta = nuevo - anterior;
      await tx.stockVariante.update({
        where: { varianteId: datos.varianteId },
        data: { cantidadActual: nuevo },
      });
      await tx.movimientoStock.create({
        data: {
          varianteId: datos.varianteId,
          nombreVariante,
          motivo: MotivoMovimientoStock.ajustePorConteo,
          cantidadVariacion: delta,
          stockResultante: nuevo,
          nota: datos.observacion?.trim() || null,
          ejecutadoPorUsuarioId,
        },
      });
      return { anterior, nuevo, delta };
    });
  }

  async aplicarEntradaManual(
    datos: EntradaManualDto,
    ejecutadoPorUsuarioId: string,
  ): Promise<{ cantidadAnterior: number; cantidadNueva: number }> {
    const nombreVariante = await this.catalogoService.nombreLineaComercial(datos.varianteId);
    await this.validarVariante(datos.varianteId);

    return this.prisma.$transaction(async (tx) => {
      await this.asegurarStockVariante(tx, datos.varianteId);
      const stock = await tx.stockVariante.findUniqueOrThrow({
        where: { varianteId: datos.varianteId },
      });
      const anterior = stock.cantidadActual;
      const nuevo = anterior + datos.cantidad;
      await tx.stockVariante.update({
        where: { varianteId: datos.varianteId },
        data: { cantidadActual: nuevo },
      });
      await tx.movimientoStock.create({
        data: {
          varianteId: datos.varianteId,
          nombreVariante,
          motivo: MotivoMovimientoStock.entradaPorCompra,
          cantidadVariacion: datos.cantidad,
          stockResultante: nuevo,
          nota: datos.nota?.trim() || 'Entrada manual de stock',
          ejecutadoPorUsuarioId,
        },
      });
      return { cantidadAnterior: anterior, cantidadNueva: nuevo };
    });
  }

  private async validarVariante(varianteId: string): Promise<void> {
    const variante = await this.prisma.variante.findUnique({
      where: { id: varianteId },
      include: { producto: true },
    });
    if (!variante || variante.producto.fechaEliminacion) {
      throw new NotFoundException('Variante no encontrada.');
    }
  }

  private async asegurarStockVariante(tx: ClienteTx, varianteId: string): Promise<void> {
    await tx.stockVariante.upsert({
      where: { varianteId },
      create: { varianteId, cantidadActual: 0 },
      update: {},
    });
  }
}
