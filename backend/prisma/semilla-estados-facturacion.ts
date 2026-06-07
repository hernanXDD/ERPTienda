import { PrismaClient } from '@prisma/client';
import {
  ID_ESTADO_FACTURACION_FACTURADA,
  ID_ESTADO_FACTURACION_PENDIENTE,
} from './datos/ids-semilla';

const estadosFacturacionSemilla = [
  {
    id: ID_ESTADO_FACTURACION_PENDIENTE,
    codigo: 'PENDIENTE',
    nombre: 'Factura pendiente',
  },
  {
    id: ID_ESTADO_FACTURACION_FACTURADA,
    codigo: 'FACTURADA',
    nombre: 'Facturada',
  },
] as const;

export async function sembrarEstadosFacturacion(prisma: PrismaClient): Promise<void> {
  for (const estado of estadosFacturacionSemilla) {
    await prisma.estadoFacturacion.upsert({
      where: { id: estado.id },
      create: estado,
      update: {
        codigo: estado.codigo,
        nombre: estado.nombre,
      },
    });
  }
}

export { estadosFacturacionSemilla };
