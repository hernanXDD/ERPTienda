import type { PrismaClient } from '@prisma/client';
import { MOTIVOS_STOCK_SEMILLA } from './datos/motivos-stock-semilla';

export async function sembrarMotivosStock(prisma: PrismaClient): Promise<void> {
  for (const datos of MOTIVOS_STOCK_SEMILLA) {
    await prisma.motivo.upsert({
      where: { id: datos.id },
      create: {
        id: datos.id,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        activo: true,
      },
      update: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        activo: true,
      },
    });
  }
}
