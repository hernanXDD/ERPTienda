import type { Prisma } from '@prisma/client';
import { filtroNoBorrado } from '../../../comunes/utilidades/borrado-logico';

type ClientePrisma = Prisma.TransactionClient;

/** Desactiva variantes activas con stock en cero por más de `dias` días. Retorna cantidad desactivada. */
export async function aplicarDeshabilitacionAutomaticaVariantes(
  prisma: ClientePrisma,
  diasDeshabilitar: number,
  ahora: Date = new Date(),
): Promise<number> {
  if (!Number.isFinite(diasDeshabilitar) || diasDeshabilitar <= 0) return 0;

  const limite = new Date(ahora);
  limite.setDate(limite.getDate() - Math.floor(diasDeshabilitar));

  const candidatos = await prisma.stockVariante.findMany({
    where: {
      cantidadActual: 0,
      fechaAgotado: { not: null, lte: limite },
      variante: { activa: true, ...filtroNoBorrado, producto: filtroNoBorrado },
    },
    select: { varianteId: true },
  });

  if (candidatos.length === 0) return 0;

  const resultado = await prisma.variante.updateMany({
    where: { id: { in: candidatos.map((c) => c.varianteId) } },
    data: { activa: false },
  });

  return resultado.count;
}
