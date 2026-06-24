import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';

type ClienteTransaccion = Prisma.TransactionClient;

export async function generarCodigoCuponUnico(cliente: ClienteTransaccion): Promise<string> {
  for (let intento = 0; intento < 12; intento += 1) {
    const codigo = randomBytes(16).toString('base64url');
    const existe = await cliente.cuponDescuento.findUnique({
      where: { codigo },
      select: { id: true },
    });
    if (!existe) return codigo;
  }
  throw new Error('No se pudo generar un código de cupón único.');
}
