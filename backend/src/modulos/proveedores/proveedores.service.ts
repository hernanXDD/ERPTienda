import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { normalizarDocumento } from '../../comunes/utilidades/normalizar-documento';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';

export interface ProveedorApi {
  id: string;
  nombre: string;
  documento: string;
  correoElectronico: string;
  telefonoPrincipal: string;
  telefonoAlternativo: string;
  direccion: string;
  limiteCreditoCompras: number;
  comprasCreditoHabilitadas: boolean;
  habilitado: boolean;
}

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  private mapear(proveedor: {
    id: string;
    nombre: string;
    documento: string;
    correoElectronico: string;
    telefonoPrincipal: string;
    telefonoAlternativo: string;
    direccion: string;
    limiteCreditoCompras: Prisma.Decimal;
    comprasCreditoHabilitadas: boolean;
    habilitado: boolean;
  }): ProveedorApi {
    return {
      id: proveedor.id,
      nombre: proveedor.nombre,
      documento: proveedor.documento,
      correoElectronico: proveedor.correoElectronico,
      telefonoPrincipal: proveedor.telefonoPrincipal,
      telefonoAlternativo: proveedor.telefonoAlternativo,
      direccion: proveedor.direccion,
      limiteCreditoCompras: decimalANumero(proveedor.limiteCreditoCompras),
      comprasCreditoHabilitadas: proveedor.comprasCreditoHabilitadas,
      habilitado: proveedor.habilitado,
    };
  }

  async listar(): Promise<ProveedorApi[]> {
    const filas = await this.prisma.proveedor.findMany({
      where: { fechaEliminacion: null },
      orderBy: { nombre: 'asc' },
    });
    return filas.map((p) => this.mapear(p));
  }

  async obtenerPorId(id: string): Promise<ProveedorApi> {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado.');
    return this.mapear(proveedor);
  }

  async crear(datos: CrearProveedorDto): Promise<ProveedorApi> {
    const documento = datos.documento.trim();
    await this.validarDocumentoUnico(documento);
    const creado = await this.prisma.proveedor.create({
      data: {
        nombre: datos.nombre.trim(),
        documento,
        correoElectronico: datos.correoElectronico?.trim() ?? '',
        telefonoPrincipal: datos.telefonoPrincipal?.trim() ?? '',
        telefonoAlternativo: datos.telefonoAlternativo?.trim() ?? '',
        direccion: datos.direccion?.trim() ?? '',
        limiteCreditoCompras: new Prisma.Decimal(datos.limiteCreditoCompras ?? 0),
        comprasCreditoHabilitadas: datos.comprasCreditoHabilitadas ?? false,
        habilitado: datos.habilitado ?? true,
      },
    });
    return this.mapear(creado);
  }

  async actualizar(id: string, datos: ActualizarProveedorDto): Promise<ProveedorApi> {
    await this.obtenerPorId(id);
    const documento = datos.documento.trim();
    await this.validarDocumentoUnico(documento, id);
    const actualizado = await this.prisma.proveedor.update({
      where: { id },
      data: {
        nombre: datos.nombre.trim(),
        documento,
        correoElectronico: datos.correoElectronico?.trim() ?? '',
        telefonoPrincipal: datos.telefonoPrincipal?.trim() ?? '',
        telefonoAlternativo: datos.telefonoAlternativo?.trim() ?? '',
        direccion: datos.direccion?.trim() ?? '',
        limiteCreditoCompras: new Prisma.Decimal(datos.limiteCreditoCompras ?? 0),
        comprasCreditoHabilitadas: datos.comprasCreditoHabilitadas ?? false,
        habilitado: datos.habilitado ?? true,
      },
    });
    return this.mapear(actualizado);
  }

  async establecerHabilitacion(id: string, habilitado: boolean): Promise<ProveedorApi> {
    await this.obtenerPorId(id);
    const actualizado = await this.prisma.proveedor.update({
      where: { id },
      data: { habilitado },
    });
    return this.mapear(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    await this.obtenerPorId(id);
    await this.prisma.proveedor.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });
  }

  private async validarDocumentoUnico(documento: string, exceptoId?: string): Promise<void> {
    const clave = normalizarDocumento(documento);
    if (!clave) throw new ConflictException('El documento es obligatorio.');
    const proveedores = await this.prisma.proveedor.findMany({
      where: { fechaEliminacion: null },
      select: { id: true, documento: true },
    });
    const duplicado = proveedores.some(
      (p) => p.id !== exceptoId && normalizarDocumento(p.documento) === clave,
    );
    if (duplicado) {
      throw new ConflictException('Ya existe un proveedor con ese documento.');
    }
  }
}
