import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface MotivoStockApi {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

@Injectable()
export class MotivosStockService {
  constructor(private readonly prisma: PrismaService) {}

  async listarActivos(): Promise<MotivoStockApi[]> {
    const motivos = await this.prisma.motivo.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    });
    return motivos.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      activo: m.activo,
    }));
  }
}
