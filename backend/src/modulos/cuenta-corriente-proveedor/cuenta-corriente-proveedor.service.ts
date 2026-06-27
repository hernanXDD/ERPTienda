import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TipoMovimientoCuentaCorriente,
} from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { TOLERANCIA_MONEDA } from '../../comunes/utilidades/validar-totales-comprobante';
import { crearCodigoPublicoReciboPagoCuentaCorrienteProveedor } from '../../comunes/utilidades/codigo-publico-recibo-cc-proveedor';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { RegistrarCargoProveedorDto } from './dto/registrar-cargo-proveedor.dto';
import { RegistrarPagoProveedorDto } from './dto/registrar-pago-proveedor.dto';
import { RegistrarMovimientoManualDto } from '../cuenta-corriente/dto/registrar-movimiento-manual.dto';

export interface OpcionesRegistrarCargoCuentaCorrienteProveedor {
  compraId?: string;
}

export interface AuditoriaPagoCuentaCorrienteProveedorApi {
  marcaTiempoUtcRegistroCliente: string;
  codigoPublicoRecibo: string;
  etiquetaUsuarioRegistrante: string;
  idUsuarioSesionRegistrante: string | null;
  canalCapturaDocumentado: 'interfaz_web_erp';
  formaDePagoEtiqueta: string;
  referenciaDelPagoOpcional: string | null;
}

export interface MovimientoCuentaCorrienteProveedorApi {
  id: string;
  proveedorId: string;
  fecha: string;
  tipoMovimiento: 'cargo' | 'pagoRegistrado';
  importe: number;
  descripcion: string;
  auditoriaPago?: AuditoriaPagoCuentaCorrienteProveedorApi;
}

export interface MovimientoConSaldoProveedorApi extends MovimientoCuentaCorrienteProveedorApi {
  saldoTrasMovimiento: number;
}

type ClienteTx = Prisma.TransactionClient;

@Injectable()
export class CuentaCorrienteProveedorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private impactoEnSaldo(tipo: TipoMovimientoCuentaCorriente, importe: number): number {
    return tipo === TipoMovimientoCuentaCorriente.cargo ? importe : -importe;
  }

  private mapearMovimiento(mov: {
    id: string;
    proveedorId: string;
    fecha: Date;
    tipoMovimiento: TipoMovimientoCuentaCorriente;
    importe: Prisma.Decimal;
    descripcion: string;
    auditoriaPagoJson: Prisma.JsonValue | null;
  }): MovimientoCuentaCorrienteProveedorApi {
    const base: MovimientoCuentaCorrienteProveedorApi = {
      id: mov.id,
      proveedorId: mov.proveedorId,
      fecha: mov.fecha.toISOString(),
      tipoMovimiento: mov.tipoMovimiento,
      importe: decimalANumero(mov.importe),
      descripcion: mov.descripcion,
    };
    if (mov.auditoriaPagoJson && mov.tipoMovimiento === TipoMovimientoCuentaCorriente.pagoRegistrado) {
      base.auditoriaPago = mov.auditoriaPagoJson as unknown as AuditoriaPagoCuentaCorrienteProveedorApi;
    }
    return base;
  }

  async validarProveedorExiste(proveedorId: string): Promise<void> {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: proveedorId, ...filtroNoBorrado },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado.');
  }

  async obtenerSaldo(proveedorId: string): Promise<number> {
    await this.validarProveedorExiste(proveedorId);
    return this.obtenerSaldoInterno(proveedorId);
  }

  async validarCreditoDisponibleParaCargo(
    proveedorId: string,
    importeCargo: number,
    limiteCredito: number,
    tx?: ClienteTx,
  ): Promise<void> {
    if (limiteCredito <= 0) return;

    const saldoActual = await this.obtenerSaldoInterno(proveedorId, tx);
    const saldoTrasCargo = saldoActual + importeCargo;

    if (saldoTrasCargo - limiteCredito > TOLERANCIA_MONEDA) {
      const disponible = Math.max(0, limiteCredito - saldoActual);
      throw new ConflictException(
        `El proveedor supera el límite de cuenta corriente. Crédito disponible: $${disponible.toFixed(0)}.`,
      );
    }
  }

  private async obtenerSaldoInterno(proveedorId: string, tx?: ClienteTx): Promise<number> {
    const prisma = tx ?? this.prisma;
    const movimientos = await prisma.movimientoCuentaCorrienteProveedor.findMany({
      where: { proveedorId },
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });
    return movimientos.reduce(
      (acum, m) => acum + this.impactoEnSaldo(m.tipoMovimiento, decimalANumero(m.importe)),
      0,
    );
  }

  async listarMovimientosConSaldo(proveedorId: string): Promise<MovimientoConSaldoProveedorApi[]> {
    await this.validarProveedorExiste(proveedorId);
    const movimientos = await this.prisma.movimientoCuentaCorrienteProveedor.findMany({
      where: { proveedorId },
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });
    let acum = 0;
    return movimientos.map((m) => {
      acum += this.impactoEnSaldo(m.tipoMovimiento, decimalANumero(m.importe));
      return { ...this.mapearMovimiento(m), saldoTrasMovimiento: acum };
    });
  }

  async registrarPago(
    proveedorId: string,
    datos: RegistrarPagoProveedorDto,
    operador: UsuarioSesion,
  ): Promise<MovimientoCuentaCorrienteProveedorApi> {
    await this.validarProveedorExiste(proveedorId);
    const auditoria: AuditoriaPagoCuentaCorrienteProveedorApi = {
      marcaTiempoUtcRegistroCliente: new Date().toISOString(),
      codigoPublicoRecibo: crearCodigoPublicoReciboPagoCuentaCorrienteProveedor(),
      etiquetaUsuarioRegistrante: operador.nombreUsuario.trim() || 'Operador sin sesión identificada',
      idUsuarioSesionRegistrante: operador.id,
      canalCapturaDocumentado: 'interfaz_web_erp',
      formaDePagoEtiqueta: datos.formaDePagoEtiqueta.trim() || 'No indicada',
      referenciaDelPagoOpcional: datos.referenciaDelPagoOpcional?.trim() || null,
    };

    const id = await this.idSecuencia.siguienteMovimientoCuentaCorrienteProveedor();
    const movimiento = await this.prisma.movimientoCuentaCorrienteProveedor.create({
      data: {
        id,
        proveedorId,
        tipoMovimiento: TipoMovimientoCuentaCorriente.pagoRegistrado,
        importe: new Prisma.Decimal(datos.importe),
        descripcion: datos.descripcion?.trim() || 'Pago registrado',
        auditoriaPagoJson: auditoria as unknown as Prisma.InputJsonValue,
        registradoPorUsuarioId: operador.id,
      },
    });
    return this.mapearMovimiento(movimiento);
  }

  async registrarMovimientoManual(
    proveedorId: string,
    datos: RegistrarMovimientoManualDto,
    operador: UsuarioSesion,
  ): Promise<MovimientoCuentaCorrienteProveedorApi> {
    await this.validarProveedorExiste(proveedorId);

    const id = await this.idSecuencia.siguienteMovimientoCuentaCorrienteProveedor();
    const movimiento = await this.prisma.movimientoCuentaCorrienteProveedor.create({
      data: {
        id,
        proveedorId,
        tipoMovimiento: datos.tipoMovimiento,
        importe: new Prisma.Decimal(datos.importe),
        descripcion: datos.descripcion.trim(),
        registradoPorUsuarioId: operador.id,
      },
    });
    return this.mapearMovimiento(movimiento);
  }

  async registrarCargo(
    proveedorId: string,
    datos: RegistrarCargoProveedorDto,
    registradoPorUsuarioId?: string,
    tx?: ClienteTx,
    opciones?: OpcionesRegistrarCargoCuentaCorrienteProveedor,
  ): Promise<MovimientoCuentaCorrienteProveedorApi> {
    const prisma = tx ?? this.prisma;
    if (!tx) await this.validarProveedorExiste(proveedorId);

    const id = await this.idSecuencia.siguienteMovimientoCuentaCorrienteProveedor(prisma);
    const movimiento = await prisma.movimientoCuentaCorrienteProveedor.create({
      data: {
        id,
        proveedorId,
        compraId: opciones?.compraId ?? null,
        tipoMovimiento: TipoMovimientoCuentaCorriente.cargo,
        importe: new Prisma.Decimal(datos.importe),
        descripcion: datos.descripcion?.trim() || 'Cargo en cuenta corriente',
        registradoPorUsuarioId: registradoPorUsuarioId ?? null,
      },
    });
    return this.mapearMovimiento(movimiento);
  }
}
