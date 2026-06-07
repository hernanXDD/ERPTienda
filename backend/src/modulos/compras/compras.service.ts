import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { siguienteNumeroComprobante } from '../../comunes/utilidades/numero-comprobante';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { StockService } from '../stock/stock.service';
import { RegistrarCompraDto } from './dto/registrar-compra.dto';

export interface LineaCompraApi {
  varianteId: string | null;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface CompraRegistradaApi {
  id: string;
  numero: string;
  fecha: string;
  proveedorId: string;
  nombreProveedorMostrar: string;
  condicionCompra: string;
  total: number;
  lineas: LineaCompraApi[];
  observaciones: string;
}

@Injectable()
export class ComprasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
    private readonly stockService: StockService,
    private readonly catalogoService: CatalogoService,
  ) {}

  async listar(): Promise<CompraRegistradaApi[]> {
    const compras = await this.prisma.compra.findMany({
      include: { lineas: true },
      orderBy: { fecha: 'desc' },
    });
    return compras.map((c) => this.mapearCompra(c));
  }

  async obtenerPorId(id: string): Promise<CompraRegistradaApi> {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: { lineas: true },
    });
    if (!compra) throw new NotFoundException('Compra no encontrada.');
    return this.mapearCompra(compra);
  }

  async registrar(datos: RegistrarCompraDto, operador: UsuarioSesion): Promise<CompraRegistradaApi> {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: datos.proveedorId, fechaEliminacion: null },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado.');

    const compra = await this.prisma.$transaction(async (tx) => {
      const ultima = await tx.compra.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = siguienteNumeroComprobante('C', ultima?.numero ?? null);
      const idCompra = await this.idSecuencia.siguienteCompra(tx);
      const idsLineas = await this.idSecuencia.siguientesCompraLinea(datos.lineas.length, tx);

      const creada = await tx.compra.create({
        data: {
          id: idCompra,
          numero,
          proveedorId: datos.proveedorId,
          nombreProveedorMostrar: datos.nombreProveedorMostrar.trim(),
          condicionCompra: datos.condicionCompra,
          total: new Prisma.Decimal(datos.total),
          observaciones: datos.observaciones?.trim() ?? '',
          lineas: {
            create: datos.lineas.map((ln, indice) => ({
              id: idsLineas[indice],
              varianteId: ln.varianteId ?? null,
              nombre: ln.nombre.trim(),
              cantidad: ln.cantidad,
              costoUnitario: new Prisma.Decimal(ln.costoUnitario),
              subtotal: new Prisma.Decimal(ln.subtotal),
            })),
          },
        },
        include: { lineas: true },
      });

      const idAuditoria = await this.stockService.iniciarAuditoriaCompra(
        tx,
        idCompra,
        numero,
        operador.id,
      );

      for (const ln of datos.lineas) {
        if (!ln.varianteId) continue;
        const nombreVariante =
          ln.nombre.trim() || (await this.catalogoService.nombreLineaComercial(ln.varianteId));
        await this.stockService.aplicarEntradaPorCompra(
          tx,
          ln.varianteId,
          nombreVariante,
          ln.cantidad,
          operador.id,
          {
            nota: `Compra ${numero}`,
            compraId: idCompra,
            auditoriaStockId: idAuditoria,
          },
        );
      }

      await this.stockService.finalizarAuditoriaStock(tx, idAuditoria);

      return creada;
    });

    return this.mapearCompra(compra);
  }

  private mapearCompra(compra: {
    id: string;
    numero: string;
    fecha: Date;
    proveedorId: string;
    nombreProveedorMostrar: string;
    condicionCompra: string;
    total: Prisma.Decimal;
    observaciones: string;
    lineas: Array<{
      varianteId: string | null;
      nombre: string;
      cantidad: number;
      costoUnitario: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }>;
  }): CompraRegistradaApi {
    return {
      id: compra.id,
      numero: compra.numero,
      fecha: compra.fecha.toISOString(),
      proveedorId: compra.proveedorId,
      nombreProveedorMostrar: compra.nombreProveedorMostrar,
      condicionCompra: compra.condicionCompra,
      total: decimalANumero(compra.total),
      observaciones: compra.observaciones,
      lineas: compra.lineas.map((ln) => ({
        varianteId: ln.varianteId,
        nombre: ln.nombre,
        cantidad: ln.cantidad,
        costoUnitario: decimalANumero(ln.costoUnitario),
        subtotal: decimalANumero(ln.subtotal),
      })),
    };
  }
}
