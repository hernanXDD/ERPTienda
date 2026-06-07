import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { normalizarDocumento } from '../../comunes/utilidades/normalizar-documento';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';

export interface ClienteApi {
  id: string;
  nombre: string;
  documento: string;
  correoElectronico: string;
  telefonoPrincipal: string;
  telefonoAlternativo: string;
  direccion: string;
  condicionIva: string;
  limiteCompraCuentaCorriente: number;
  cuentaCorrienteHabilitada: boolean;
  habilitado: boolean;
}

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private mapear(cliente: {
    id: string;
    nombre: string;
    documento: string;
    correoElectronico: string;
    telefonoPrincipal: string;
    telefonoAlternativo: string;
    direccion: string;
    condicionIva: string;
    limiteCompraCuentaCorriente: Prisma.Decimal;
    cuentaCorrienteHabilitada: boolean;
    habilitado: boolean;
  }): ClienteApi {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      documento: cliente.documento,
      correoElectronico: cliente.correoElectronico,
      telefonoPrincipal: cliente.telefonoPrincipal,
      telefonoAlternativo: cliente.telefonoAlternativo,
      direccion: cliente.direccion,
      condicionIva: cliente.condicionIva,
      limiteCompraCuentaCorriente: decimalANumero(cliente.limiteCompraCuentaCorriente),
      cuentaCorrienteHabilitada: cliente.cuentaCorrienteHabilitada,
      habilitado: cliente.habilitado,
    };
  }

  async listar(): Promise<ClienteApi[]> {
    const filas = await this.prisma.cliente.findMany({
      where: { fechaEliminacion: null },
      orderBy: { nombre: 'asc' },
    });
    return filas.map((c) => this.mapear(c));
  }

  async obtenerPorId(id: string): Promise<ClienteApi> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado.');
    return this.mapear(cliente);
  }

  async crear(datos: CrearClienteDto): Promise<ClienteApi> {
    const documento = datos.documento.trim();
    await this.validarDocumentoUnico(documento);
    const id = await this.idSecuencia.siguienteCliente();
    const creado = await this.prisma.cliente.create({
      data: {
        id,
        nombre: datos.nombre.trim(),
        documento,
        correoElectronico: datos.correoElectronico?.trim() ?? '',
        telefonoPrincipal: datos.telefonoPrincipal?.trim() ?? '',
        telefonoAlternativo: datos.telefonoAlternativo?.trim() ?? '',
        direccion: datos.direccion?.trim() ?? '',
        condicionIva: datos.condicionIva ?? 'CONSUMIDOR_FINAL',
        limiteCompraCuentaCorriente: new Prisma.Decimal(
          datos.limiteCompraCuentaCorriente ?? 0,
        ),
        cuentaCorrienteHabilitada: datos.cuentaCorrienteHabilitada ?? false,
        habilitado: datos.habilitado ?? true,
      },
    });
    return this.mapear(creado);
  }

  async actualizar(id: string, datos: ActualizarClienteDto): Promise<ClienteApi> {
    await this.obtenerPorId(id);
    const documento = datos.documento.trim();
    await this.validarDocumentoUnico(documento, id);
    const actualizado = await this.prisma.cliente.update({
      where: { id },
      data: {
        nombre: datos.nombre.trim(),
        documento,
        correoElectronico: datos.correoElectronico?.trim() ?? '',
        telefonoPrincipal: datos.telefonoPrincipal?.trim() ?? '',
        telefonoAlternativo: datos.telefonoAlternativo?.trim() ?? '',
        direccion: datos.direccion?.trim() ?? '',
        condicionIva: datos.condicionIva ?? 'CONSUMIDOR_FINAL',
        limiteCompraCuentaCorriente: new Prisma.Decimal(
          datos.limiteCompraCuentaCorriente ?? 0,
        ),
        cuentaCorrienteHabilitada: datos.cuentaCorrienteHabilitada ?? false,
        habilitado: datos.habilitado ?? true,
      },
    });
    return this.mapear(actualizado);
  }

  async establecerHabilitacion(id: string, habilitado: boolean): Promise<ClienteApi> {
    await this.obtenerPorId(id);
    const actualizado = await this.prisma.cliente.update({
      where: { id },
      data: { habilitado },
    });
    return this.mapear(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    await this.obtenerPorId(id);
    await this.prisma.cliente.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });
  }

  private async validarDocumentoUnico(documento: string, exceptoId?: string): Promise<void> {
    const clave = normalizarDocumento(documento);
    if (!clave) throw new ConflictException('El documento es obligatorio.');
    const clientes = await this.prisma.cliente.findMany({
      where: { fechaEliminacion: null },
      select: { id: true, documento: true },
    });
    const duplicado = clientes.some(
      (c) => c.id !== exceptoId && normalizarDocumento(c.documento) === clave,
    );
    if (duplicado) {
      throw new ConflictException('Ya existe un cliente con ese documento.');
    }
  }
}
