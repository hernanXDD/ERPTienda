/**
 * Completa condición IVA y datos de facturación en registros existentes
 * (útil tras aplicar la migración de facturación en bases ya sembradas).
 */
import { CondicionIvaCliente, PrismaClient } from '@prisma/client';
import { clientesSemilla } from './semilla-dominio';
import { armarDatosFacturacionVentaSemilla, ventasSemilla } from './semilla-transacciones';

export async function sembrarDatosFacturacion(prisma: PrismaClient): Promise<void> {
  for (const cliente of clientesSemilla) {
    await prisma.cliente.updateMany({
      where: { id: cliente.id },
      data: { condicionIva: cliente.condicionIva },
    });
  }

  const clientes = await prisma.cliente.findMany({
    select: { id: true, documento: true, condicionIva: true },
  });
  const clientesPorId = new Map(
    clientes.map((cliente) => [
      cliente.id,
      { documento: cliente.documento, condicionIva: cliente.condicionIva },
    ]),
  );

  const idsVentasSemilla = new Set(ventasSemilla.map((venta) => venta.id));

  for (const ventaSemilla of ventasSemilla) {
    const datos = armarDatosFacturacionVentaSemilla(ventaSemilla, clientesPorId);
    await prisma.venta.updateMany({
      where: { id: ventaSemilla.id },
      data: {
        nombreClienteMostrar: ventaSemilla.nombreClienteMostrar,
        documentoClienteMostrar: datos.documentoClienteMostrar,
        condicionIvaCliente: datos.condicionIvaCliente,
        estadoFacturacionId: datos.estadoFacturacionId,
        facturacion: datos.facturacion,
      },
    });
  }

  const ventasRestantes = await prisma.venta.findMany({
    where: {
      clienteId: { not: null },
      id: { notIn: [...idsVentasSemilla] },
    },
    select: {
      id: true,
      clienteId: true,
      documentoClienteMostrar: true,
      condicionIvaCliente: true,
    },
  });

  for (const venta of ventasRestantes) {
    if (!venta.clienteId) continue;
    const cliente = clientesPorId.get(venta.clienteId);
    if (!cliente) continue;

    const actualizar: {
      documentoClienteMostrar?: string;
      condicionIvaCliente?: CondicionIvaCliente;
    } = {};

    if (!venta.documentoClienteMostrar.trim()) {
      actualizar.documentoClienteMostrar = cliente.documento;
    }
    if (venta.condicionIvaCliente === CondicionIvaCliente.CONSUMIDOR_FINAL) {
      actualizar.condicionIvaCliente = cliente.condicionIva;
    }

    if (Object.keys(actualizar).length === 0) continue;

    await prisma.venta.update({
      where: { id: venta.id },
      data: actualizar,
    });
  }
}
