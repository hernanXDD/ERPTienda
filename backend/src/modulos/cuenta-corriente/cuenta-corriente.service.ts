import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TipoMovimientoCuentaCorriente,
} from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { TOLERANCIA_MONEDA } from '../../comunes/utilidades/validar-totales-comprobante';
import { crearCodigoPublicoReciboPagoCuentaCorriente } from '../../comunes/utilidades/codigo-publico-recibo-cc';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { RegistrarCargoDto } from './dto/registrar-cargo.dto';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';

export interface AuditoriaPagoCuentaCorrienteApi {
  marcaTiempoUtcRegistroCliente: string;
  codigoPublicoRecibo: string;
  etiquetaUsuarioRegistrante: string;
  idUsuarioSesionRegistrante: string | null;
  canalCapturaDocumentado: 'interfaz_web_erp';
  formaDePagoEtiqueta: string;
  referenciaDelPagoOpcional: string | null;
}

export interface MovimientoCuentaCorrienteApi {
  id: string;
  clienteId: string;
  fecha: string;
  tipoMovimiento: 'cargo' | 'pagoRegistrado';
  importe: number;
  descripcion: string;
  auditoriaPago?: AuditoriaPagoCuentaCorrienteApi;
}

export interface MovimientoConSaldoApi extends MovimientoCuentaCorrienteApi {
  saldoTrasMovimiento: number;
}

type ClienteTx = Prisma.TransactionClient;

@Injectable()
export class CuentaCorrienteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private impactoEnSaldo(tipo: TipoMovimientoCuentaCorriente, importe: number): number {
    return tipo === TipoMovimientoCuentaCorriente.cargo ? importe : -importe;
  }

  private mapearMovimiento(mov: {
    id: string;
    clienteId: string;
    fecha: Date;
    tipoMovimiento: TipoMovimientoCuentaCorriente;
    importe: Prisma.Decimal;
    descripcion: string;
    auditoriaPagoJson: Prisma.JsonValue | null;
  }): MovimientoCuentaCorrienteApi {
    const base: MovimientoCuentaCorrienteApi = {
      id: mov.id,
      clienteId: mov.clienteId,
      fecha: mov.fecha.toISOString(),
      tipoMovimiento: mov.tipoMovimiento,
      importe: decimalANumero(mov.importe),
      descripcion: mov.descripcion,
    };
    if (mov.auditoriaPagoJson && mov.tipoMovimiento === TipoMovimientoCuentaCorriente.pagoRegistrado) {
      base.auditoriaPago = mov.auditoriaPagoJson as unknown as AuditoriaPagoCuentaCorrienteApi;
    }
    return base;
  }

  async validarClienteExiste(clienteId: string): Promise<void> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, ...filtroNoBorrado },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado.');
  }

  async obtenerSaldo(clienteId: string): Promise<number> {
    await this.validarClienteExiste(clienteId);
    return this.obtenerSaldoInterno(clienteId);
  }

  /**
   * Verifica que un cargo no supere el límite de crédito del cliente.
   * Si `limiteCompra <= 0`, se interpreta como crédito sin tope.
   */
  async validarCreditoDisponibleParaCargo(
    clienteId: string,
    importeCargo: number,
    limiteCompra: number,
    tx?: ClienteTx,
  ): Promise<void> {
    if (limiteCompra <= 0) return;

    const saldoActual = await this.obtenerSaldoInterno(clienteId, tx);
    const saldoTrasCargo = saldoActual + importeCargo;

    if (saldoTrasCargo - limiteCompra > TOLERANCIA_MONEDA) {
      const disponible = Math.max(0, limiteCompra - saldoActual);
      throw new ConflictException(
        `El cliente supera el límite de cuenta corriente. Crédito disponible: $${disponible.toFixed(0)}.`,
      );
    }
  }

  private async obtenerSaldoInterno(clienteId: string, tx?: ClienteTx): Promise<number> {
    const prisma = tx ?? this.prisma;
    const movimientos = await prisma.movimientoCuentaCorriente.findMany({
      where: { clienteId },
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });
    return movimientos.reduce(
      (acum, m) => acum + this.impactoEnSaldo(m.tipoMovimiento, decimalANumero(m.importe)),
      0,
    );
  }

  async listarMovimientosConSaldo(clienteId: string): Promise<MovimientoConSaldoApi[]> {
    await this.validarClienteExiste(clienteId);
    const movimientos = await this.prisma.movimientoCuentaCorriente.findMany({
      where: { clienteId },
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });
    let acum = 0;
    return movimientos.map((m) => {
      acum += this.impactoEnSaldo(m.tipoMovimiento, decimalANumero(m.importe));
      return { ...this.mapearMovimiento(m), saldoTrasMovimiento: acum };
    });
  }

  async registrarPago(
    clienteId: string,
    datos: RegistrarPagoDto,
    operador: UsuarioSesion,
  ): Promise<MovimientoCuentaCorrienteApi> {
    await this.validarClienteExiste(clienteId);
    const auditoria: AuditoriaPagoCuentaCorrienteApi = {
      marcaTiempoUtcRegistroCliente: new Date().toISOString(),
      codigoPublicoRecibo: crearCodigoPublicoReciboPagoCuentaCorriente(),
      etiquetaUsuarioRegistrante: operador.nombreUsuario.trim() || 'Operador sin sesión identificada',
      idUsuarioSesionRegistrante: operador.id,
      canalCapturaDocumentado: 'interfaz_web_erp',
      formaDePagoEtiqueta: datos.formaDePagoEtiqueta.trim() || 'No indicada',
      referenciaDelPagoOpcional: datos.referenciaDelPagoOpcional?.trim() || null,
    };

    const id = await this.idSecuencia.siguienteMovimientoCuentaCorriente();
    const movimiento = await this.prisma.movimientoCuentaCorriente.create({
      data: {
        id,
        clienteId,
        tipoMovimiento: TipoMovimientoCuentaCorriente.pagoRegistrado,
        importe: new Prisma.Decimal(datos.importe),
        descripcion: datos.descripcion?.trim() || 'Pago registrado',
        auditoriaPagoJson: auditoria as unknown as Prisma.InputJsonValue,
        registradoPorUsuarioId: operador.id,
      },
    });
    return this.mapearMovimiento(movimiento);
  }

  async registrarCargo(
    clienteId: string,
    datos: RegistrarCargoDto,
    registradoPorUsuarioId?: string,
    tx?: ClienteTx,
  ): Promise<MovimientoCuentaCorrienteApi> {
    const prisma = tx ?? this.prisma;
    if (!tx) await this.validarClienteExiste(clienteId);

    const id = await this.idSecuencia.siguienteMovimientoCuentaCorriente(prisma);
    const movimiento = await prisma.movimientoCuentaCorriente.create({
      data: {
        id,
        clienteId,
        tipoMovimiento: TipoMovimientoCuentaCorriente.cargo,
        importe: new Prisma.Decimal(datos.importe),
        descripcion: datos.descripcion?.trim() || 'Cargo en cuenta corriente',
        registradoPorUsuarioId: registradoPorUsuarioId ?? null,
      },
    });
    return this.mapearMovimiento(movimiento);
  }

  async registrarCreditoPorDevolucion(
    clienteId: string,
    importe: number,
    descripcion: string,
    registradoPorUsuarioId: string,
    tx?: ClienteTx,
  ): Promise<MovimientoCuentaCorrienteApi> {
    const prisma = tx ?? this.prisma;
    if (!tx) await this.validarClienteExiste(clienteId);

    const id = await this.idSecuencia.siguienteMovimientoCuentaCorriente(prisma);
    const movimiento = await prisma.movimientoCuentaCorriente.create({
      data: {
        id,
        clienteId,
        tipoMovimiento: TipoMovimientoCuentaCorriente.pagoRegistrado,
        importe: new Prisma.Decimal(importe),
        descripcion: descripcion.trim() || 'Crédito por devolución',
        registradoPorUsuarioId,
      },
    });
    return this.mapearMovimiento(movimiento);
  }
}
