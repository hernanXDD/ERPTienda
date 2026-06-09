import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoAuditoriaStock } from '@prisma/client';
import {
  ID_MOTIVO_AJUSTE_CONTEO,
  ID_MOTIVO_ENTRADA_COMPRA,
  ID_MOTIVO_SALIDA_VENTA,
} from '../../comunes/constantes/ids-motivo-stock';
import { armarNombreLineaComercial } from '../../comunes/utilidades/nombre-linea-comercial';
import { filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { AjusteConteoDto } from './dto/ajuste-conteo.dto';
import { EntradaManualDto } from './dto/entrada-manual.dto';
import { ImportarConteoDto } from './dto/importar-conteo.dto';
import { ListarAuditoriasDto } from './dto/listar-auditorias.dto';

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

export interface RegistroOperadorStockApi {
  idUsuario: string | null;
  etiquetaUsuario: string;
}

export interface MovimientoStockApi {
  id: string;
  fecha: string;
  varianteId: string;
  nombreVariante: string;
  motivoId: string;
  nombreMotivo: string;
  cantidadVariacion: number;
  stockResultante: number;
  idVenta?: string | null;
  numeroVenta?: string | null;
  idCompra?: string | null;
  idAuditoriaStock?: string | null;
  nota?: string | null;
  registradoPor: RegistroOperadorStockApi;
}

export interface AuditoriaStockResumenApi {
  id: string;
  tipo: TipoAuditoriaStock;
  fecha: string;
  titulo: string;
  referencia: string | null;
  nota: string | null;
  cantidadMovimientos: number;
  variacionNeta: number;
  registradoPor: RegistroOperadorStockApi;
}

export interface AuditoriaStockDetalleApi extends AuditoriaStockResumenApi {
  movimientos: MovimientoStockApi[];
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

export interface DetalleImportacionConteoApi {
  varianteId: string;
  nombreVariante: string;
  anterior: number;
  nuevo: number;
  delta: number;
}

export interface ResultadoImportacionConteoApi {
  lineasProcesadas: number;
  lineasSinCambio: number;
  detalle: DetalleImportacionConteoApi[];
}

export interface OpcionesEntradaStock {
  nota?: string;
  compraId?: string;
  auditoriaStockId?: string;
}

type ClienteTx = Prisma.TransactionClient;

const USUARIO_MOVIMIENTO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  nombreUsuario: true,
} as const;

const USUARIO_AUDITORIA_SELECT = USUARIO_MOVIMIENTO_SELECT;

const MOTIVO_STOCK_SELECT = {
  select: { id: true, nombre: true },
} as const;

function mapearRegistradoPorStock(
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
  } | null | undefined,
): RegistroOperadorStockApi {
  if (!usuario) {
    return { idUsuario: null, etiquetaUsuario: '—' };
  }
  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
  return {
    idUsuario: usuario.id,
    etiquetaUsuario: nombreCompleto || usuario.nombreUsuario,
  };
}

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
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
    auditoriaStockId?: string;
    limite?: number;
  }): Promise<MovimientoStockApi[]> {
    const where: Prisma.MovimientoStockWhereInput = {};
    if (filtros.varianteId) where.varianteId = filtros.varianteId;
    if (filtros.auditoriaStockId) where.auditoriaStockId = filtros.auditoriaStockId;
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha = {};
      if (filtros.fechaDesde) where.fecha.gte = filtros.fechaDesde;
      if (filtros.fechaHasta) where.fecha.lte = filtros.fechaHasta;
    }

    const movimientos = await this.prisma.movimientoStock.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: filtros.limite ?? 500,
      include: {
        motivo: MOTIVO_STOCK_SELECT,
        ejecutadoPorUsuario: { select: USUARIO_MOVIMIENTO_SELECT },
      },
    });

    return movimientos.map((m) => this.mapearMovimientoStock(m));
  }

  async listarAuditorias(filtros: ListarAuditoriasDto): Promise<AuditoriaStockResumenApi[]> {
    const where: Prisma.AuditoriaStockWhereInput = {};

    if (filtros.tipo) where.tipo = filtros.tipo;

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fecha = {};
      if (filtros.fechaDesde) where.fecha.gte = new Date(filtros.fechaDesde);
      if (filtros.fechaHasta) {
        where.fecha.lte = new Date(`${filtros.fechaHasta}T23:59:59.999`);
      }
    }

    const busqueda = filtros.busqueda?.trim();
    if (busqueda) {
      where.OR = [
        { titulo: { contains: busqueda, mode: 'insensitive' } },
        { referencia: { contains: busqueda, mode: 'insensitive' } },
        { nota: { contains: busqueda, mode: 'insensitive' } },
        {
          ejecutadoPorUsuario: {
            OR: [
              { nombre: { contains: busqueda, mode: 'insensitive' } },
              { apellido: { contains: busqueda, mode: 'insensitive' } },
              { nombreUsuario: { contains: busqueda, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const auditorias = await this.prisma.auditoriaStock.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 500,
      include: { ejecutadoPorUsuario: { select: USUARIO_AUDITORIA_SELECT } },
    });

    return auditorias.map((a) => this.mapearAuditoriaResumen(a));
  }

  async obtenerAuditoriaPorId(id: string): Promise<AuditoriaStockDetalleApi> {
    const auditoria = await this.prisma.auditoriaStock.findUnique({
      where: { id },
      include: {
        ejecutadoPorUsuario: { select: USUARIO_AUDITORIA_SELECT },
        movimientos: {
          orderBy: { fecha: 'asc' },
          include: {
            motivo: MOTIVO_STOCK_SELECT,
            ejecutadoPorUsuario: { select: USUARIO_MOVIMIENTO_SELECT },
          },
        },
      },
    });
    if (!auditoria) throw new NotFoundException('Auditoría de stock no encontrada.');

    return {
      ...this.mapearAuditoriaResumen(auditoria),
      movimientos: auditoria.movimientos.map((m) => this.mapearMovimientoStock(m)),
    };
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
      if (variante.borrado || variante.producto.borrado) continue;
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

  async iniciarAuditoriaCompra(
    tx: ClienteTx,
    compraId: string,
    numeroCompra: string,
    ejecutadoPorUsuarioId: string,
  ): Promise<string> {
    return this.crearAuditoriaStock(tx, {
      tipo: TipoAuditoriaStock.compra,
      titulo: `Compra ${numeroCompra}`,
      referencia: numeroCompra,
      compraId,
      ejecutadoPorUsuarioId,
    });
  }

  async aplicarSalidaPorVenta(
    tx: ClienteTx,
    lineas: LineaVentaStock[],
    ventaId: string,
    numeroVenta: string,
    ejecutadoPorUsuarioId: string | null,
  ): Promise<void> {
    const idAuditoria = await this.crearAuditoriaStock(tx, {
      tipo: TipoAuditoriaStock.venta,
      titulo: `Venta ${numeroVenta}`,
      referencia: numeroVenta,
      ventaId,
      ejecutadoPorUsuarioId,
    });

    for (const ln of lineas) {
      const stock = await tx.stockVariante.findUnique({ where: { varianteId: ln.varianteId } });
      if (!stock) throw new NotFoundException(`Sin stock para variante ${ln.varianteId}.`);
      const nuevo = stock.cantidadActual - ln.cantidad;
      await tx.stockVariante.update({
        where: { varianteId: ln.varianteId },
        data: { cantidadActual: nuevo },
      });
      const idMovimiento = await this.idSecuencia.siguienteMovimientoStock(tx);
      await tx.movimientoStock.create({
        data: {
          id: idMovimiento,
          varianteId: ln.varianteId,
          nombreVariante: ln.nombre,
          motivoId: ID_MOTIVO_SALIDA_VENTA,
          cantidadVariacion: -ln.cantidad,
          stockResultante: nuevo,
          ventaId,
          numeroVenta,
          auditoriaStockId: idAuditoria,
          ejecutadoPorUsuarioId,
        },
      });
    }

    await this.actualizarResumenAuditoria(tx, idAuditoria);
  }

  async aplicarEntradaPorCompra(
    tx: ClienteTx,
    varianteId: string,
    nombreVariante: string,
    cantidad: number,
    ejecutadoPorUsuarioId: string | null,
    opciones: OpcionesEntradaStock = {},
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
    const idMotivoCompra = ID_MOTIVO_ENTRADA_COMPRA;
    const idMovimiento = await this.idSecuencia.siguienteMovimientoStock(tx);
    await tx.movimientoStock.create({
      data: {
        id: idMovimiento,
        varianteId,
        nombreVariante,
        motivoId: idMotivoCompra,
        cantidadVariacion: unidades,
        stockResultante: nuevo,
        nota: opciones.nota ?? null,
        compraId: opciones.compraId ?? null,
        auditoriaStockId: opciones.auditoriaStockId ?? null,
        ejecutadoPorUsuarioId,
      },
    });
  }

  async finalizarAuditoriaStock(tx: ClienteTx, auditoriaStockId: string): Promise<void> {
    await this.actualizarResumenAuditoria(tx, auditoriaStockId);
  }

  async aplicarAjustePorConteo(
    datos: AjusteConteoDto,
    ejecutadoPorUsuarioId: string,
  ): Promise<{ anterior: number; nuevo: number; delta: number }> {
    const nombreVariante = await this.catalogoService.nombreLineaComercial(datos.varianteId);
    await this.validarVariante(datos.varianteId);
    const observacion = datos.observacion?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const idAuditoria = await this.crearAuditoriaStock(tx, {
        tipo: TipoAuditoriaStock.conteo,
        titulo: `Conteo · ${nombreVariante}`,
        nota: observacion,
        ejecutadoPorUsuarioId,
      });

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
      const idMovimiento = await this.idSecuencia.siguienteMovimientoStock(tx);
      await tx.movimientoStock.create({
        data: {
          id: idMovimiento,
          varianteId: datos.varianteId,
          nombreVariante,
          motivoId: ID_MOTIVO_AJUSTE_CONTEO,
          cantidadVariacion: delta,
          stockResultante: nuevo,
          nota: observacion,
          auditoriaStockId: idAuditoria,
          ejecutadoPorUsuarioId,
        },
      });

      await this.actualizarResumenAuditoria(tx, idAuditoria);
      return { anterior, nuevo, delta };
    });
  }

  async importarConteoMasivo(
    datos: ImportarConteoDto,
    ejecutadoPorUsuarioId: string,
  ): Promise<ResultadoImportacionConteoApi> {
    const idsVariantes = datos.lineas.map((ln) => ln.varianteId);
    if (new Set(idsVariantes).size !== idsVariantes.length) {
      throw new BadRequestException('La importación incluye variantes repetidas.');
    }

    const notaBase = datos.observacion?.trim()
      ? `Importación masiva de conteo físico. ${datos.observacion.trim()}`
      : 'Importación masiva de conteo físico.';

    return this.prisma.$transaction(async (tx) => {
      const variantes = await tx.variante.findMany({
        where: { id: { in: idsVariantes }, activa: true, ...filtroNoBorrado, producto: filtroNoBorrado },
        include: { producto: true },
      });
      const mapaVariantes = new Map(variantes.map((v) => [v.id, v]));
      for (const id of idsVariantes) {
        if (!mapaVariantes.has(id)) {
          throw new NotFoundException(`Variante no encontrada o inactiva: ${id}.`);
        }
      }

      const stocks = await tx.stockVariante.findMany({
        where: { varianteId: { in: idsVariantes } },
      });
      const mapaStock = new Map(stocks.map((s) => [s.varianteId, s.cantidadActual]));

      const pendientes: DetalleImportacionConteoApi[] = [];
      let lineasSinCambio = 0;

      for (const ln of datos.lineas) {
        const variante = mapaVariantes.get(ln.varianteId)!;
        const anterior = mapaStock.get(ln.varianteId) ?? 0;
        const nuevo = ln.cantidadFisicaContada;
        if (anterior === nuevo) {
          lineasSinCambio += 1;
          continue;
        }
        pendientes.push({
          varianteId: ln.varianteId,
          nombreVariante: armarNombreLineaComercial(
            variante.producto.nombre,
            variante.talle,
            variante.color,
          ),
          anterior,
          nuevo,
          delta: nuevo - anterior,
        });
      }

      if (pendientes.length === 0) {
        return { lineasProcesadas: 0, lineasSinCambio, detalle: [] };
      }

      const idAuditoria = await this.crearAuditoriaStock(tx, {
        tipo: TipoAuditoriaStock.conteo,
        titulo: `Conteo físico (${pendientes.length} artículos)`,
        nota: notaBase,
        ejecutadoPorUsuarioId,
      });

      const idsMovimientos = await this.idSecuencia.siguientesMovimientoStock(pendientes.length, tx);

      for (let i = 0; i < pendientes.length; i += 1) {
        const fila = pendientes[i];
        await this.asegurarStockVariante(tx, fila.varianteId);
        await tx.stockVariante.update({
          where: { varianteId: fila.varianteId },
          data: { cantidadActual: fila.nuevo },
        });
        await tx.movimientoStock.create({
          data: {
            id: idsMovimientos[i],
            varianteId: fila.varianteId,
            nombreVariante: fila.nombreVariante,
            motivoId: ID_MOTIVO_AJUSTE_CONTEO,
            cantidadVariacion: fila.delta,
            stockResultante: fila.nuevo,
            nota: notaBase,
            auditoriaStockId: idAuditoria,
            ejecutadoPorUsuarioId,
          },
        });
      }

      await this.actualizarResumenAuditoria(tx, idAuditoria);

      return {
        lineasProcesadas: pendientes.length,
        lineasSinCambio,
        detalle: pendientes,
      };
    });
  }

  async aplicarEntradaManual(
    datos: EntradaManualDto,
    ejecutadoPorUsuarioId: string,
  ): Promise<{ cantidadAnterior: number; cantidadNueva: number }> {
    const nombreVariante = await this.catalogoService.nombreLineaComercial(datos.varianteId);
    await this.validarVariante(datos.varianteId);
    const nota = datos.nota?.trim() || 'Entrada manual de stock';

    return this.prisma.$transaction(async (tx) => {
      const idAuditoria = await this.crearAuditoriaStock(tx, {
        tipo: TipoAuditoriaStock.compra,
        titulo: nota,
        nota,
        ejecutadoPorUsuarioId,
      });

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
      const idMovimiento = await this.idSecuencia.siguienteMovimientoStock(tx);
      await tx.movimientoStock.create({
        data: {
          id: idMovimiento,
          varianteId: datos.varianteId,
          nombreVariante,
          motivoId: ID_MOTIVO_ENTRADA_COMPRA,
          cantidadVariacion: datos.cantidad,
          stockResultante: nuevo,
          nota,
          auditoriaStockId: idAuditoria,
          ejecutadoPorUsuarioId,
        },
      });

      await this.actualizarResumenAuditoria(tx, idAuditoria);
      return { cantidadAnterior: anterior, cantidadNueva: nuevo };
    });
  }

  private mapearMovimientoStock(m: {
    id: string;
    fecha: Date;
    varianteId: string;
    nombreVariante: string;
    motivo: { id: string; nombre: string };
    cantidadVariacion: number;
    stockResultante: number;
    ventaId: string | null;
    numeroVenta: string | null;
    compraId: string | null;
    auditoriaStockId: string | null;
    nota: string | null;
    ejecutadoPorUsuario: {
      id: string;
      nombre: string;
      apellido: string;
      nombreUsuario: string;
    } | null;
  }): MovimientoStockApi {
    return {
      id: m.id,
      fecha: m.fecha.toISOString(),
      varianteId: m.varianteId,
      nombreVariante: m.nombreVariante,
      motivoId: m.motivo.id,
      nombreMotivo: m.motivo.nombre,
      cantidadVariacion: m.cantidadVariacion,
      stockResultante: m.stockResultante,
      idVenta: m.ventaId,
      numeroVenta: m.numeroVenta,
      idCompra: m.compraId,
      idAuditoriaStock: m.auditoriaStockId,
      nota: m.nota,
      registradoPor: mapearRegistradoPorStock(m.ejecutadoPorUsuario),
    };
  }

  private mapearAuditoriaResumen(a: {
    id: string;
    tipo: TipoAuditoriaStock;
    fecha: Date;
    titulo: string;
    referencia: string | null;
    nota: string | null;
    cantidadMovimientos: number;
    variacionNeta: number;
    ejecutadoPorUsuario: {
      id: string;
      nombre: string;
      apellido: string;
      nombreUsuario: string;
    } | null;
  }): AuditoriaStockResumenApi {
    return {
      id: a.id,
      tipo: a.tipo,
      fecha: a.fecha.toISOString(),
      titulo: a.titulo,
      referencia: a.referencia,
      nota: a.nota,
      cantidadMovimientos: a.cantidadMovimientos,
      variacionNeta: a.variacionNeta,
      registradoPor: mapearRegistradoPorStock(a.ejecutadoPorUsuario),
    };
  }

  private async crearAuditoriaStock(
    tx: ClienteTx,
    datos: {
      tipo: TipoAuditoriaStock;
      titulo: string;
      referencia?: string | null;
      nota?: string | null;
      ventaId?: string | null;
      compraId?: string | null;
      ejecutadoPorUsuarioId?: string | null;
    },
  ): Promise<string> {
    const id = await this.idSecuencia.siguienteAuditoriaStock(tx);
    await tx.auditoriaStock.create({
      data: {
        id,
        tipo: datos.tipo,
        titulo: datos.titulo,
        referencia: datos.referencia ?? null,
        nota: datos.nota ?? null,
        ventaId: datos.ventaId ?? null,
        compraId: datos.compraId ?? null,
        ejecutadoPorUsuarioId: datos.ejecutadoPorUsuarioId ?? null,
      },
    });
    return id;
  }

  private async actualizarResumenAuditoria(tx: ClienteTx, auditoriaStockId: string): Promise<void> {
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

  private async validarVariante(varianteId: string): Promise<void> {
    const variante = await this.prisma.variante.findUnique({
      where: { id: varianteId },
      include: { producto: true },
    });
    if (!variante || variante.borrado || variante.producto.borrado) {
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
