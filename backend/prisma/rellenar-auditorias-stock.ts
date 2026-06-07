/**
 * Rellena auditoria_stock y enlaza movimientos existentes sin auditoria_stock_id.
 * Ejecutar una vez tras la migración: npm run prisma:rellenar-auditorias
 */
import { PrismaClient, TipoAuditoriaStock } from '@prisma/client';
import {
  ID_MOTIVO_AJUSTE_CONTEO,
  ID_MOTIVO_ENTRADA_COMPRA,
} from '../src/comunes/constantes/ids-motivo-stock';
import { formatearIdEntidad } from '../src/comunes/utilidades/id-entidad';

const prisma = new PrismaClient();

const PREFIJO_NOTA_CONTEO_MASIVO = 'Importación masiva de conteo físico';
const PATRON_NOTA_COMPRA = /^Compra\s+(C-\d+)/i;

type MovimientoSinAuditoria = Awaited<
  ReturnType<typeof prisma.movimientoStock.findMany>
>[number];

async function siguienteAuditoriaId(): Promise<string> {
  const ultima = await prisma.auditoriaStock.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const base = ultima ? Number.parseInt(ultima.id, 10) : 0;
  return formatearIdEntidad(base + 1);
}

async function crearAuditoriaDesdeMovimientos(
  movimientos: MovimientoSinAuditoria[],
  datos: {
    tipo: TipoAuditoriaStock;
    titulo: string;
    referencia?: string | null;
    nota?: string | null;
    ventaId?: string | null;
    compraId?: string | null;
  },
): Promise<void> {
  if (movimientos.length === 0) return;

  const id = await siguienteAuditoriaId();
  const fecha = movimientos.reduce(
    (min, m) => (m.fecha < min ? m.fecha : min),
    movimientos[0].fecha,
  );
  const variacionNeta = movimientos.reduce((suma, m) => suma + m.cantidadVariacion, 0);
  const ejecutadoPorUsuarioId = movimientos[0].ejecutadoPorUsuarioId;

  await prisma.auditoriaStock.create({
    data: {
      id,
      tipo: datos.tipo,
      fecha,
      titulo: datos.titulo,
      referencia: datos.referencia ?? null,
      nota: datos.nota ?? null,
      ventaId: datos.ventaId ?? null,
      compraId: datos.compraId ?? null,
      ejecutadoPorUsuarioId,
      cantidadMovimientos: movimientos.length,
      variacionNeta,
    },
  });

  await prisma.movimientoStock.updateMany({
    where: { id: { in: movimientos.map((m) => m.id) } },
    data: { auditoriaStockId: id },
  });

  console.log(`  + Auditoría ${id} (${datos.tipo}): ${datos.titulo} — ${movimientos.length} mov.`);
}

async function main(): Promise<void> {
  const sinAuditoria = await prisma.movimientoStock.findMany({
    where: { auditoriaStockId: null },
    orderBy: { fecha: 'asc' },
  });

  if (sinAuditoria.length === 0) {
    console.log('No hay movimientos pendientes de auditoría.');
    return;
  }

  console.log(`Procesando ${sinAuditoria.length} movimiento(s) sin auditoría…`);

  const procesados = new Set<string>();
  const compras = await prisma.compra.findMany({ select: { id: true, numero: true } });
  const mapaComprasPorNumero = new Map(compras.map((c) => [c.numero.toUpperCase(), c.id]));

  const porVenta = new Map<string, MovimientoSinAuditoria[]>();
  for (const m of sinAuditoria) {
    if (m.ventaId) {
      const lista = porVenta.get(m.ventaId) ?? [];
      lista.push(m);
      porVenta.set(m.ventaId, lista);
    }
  }

  for (const [ventaId, movs] of porVenta) {
    const numeroVenta = movs[0]?.numeroVenta ?? ventaId;
    await crearAuditoriaDesdeMovimientos(movs, {
      tipo: TipoAuditoriaStock.venta,
      titulo: `Venta ${numeroVenta}`,
      referencia: numeroVenta,
      ventaId,
    });
    movs.forEach((m) => procesados.add(m.id));
  }

  const porCompra = new Map<string, MovimientoSinAuditoria[]>();
  for (const m of sinAuditoria) {
    if (procesados.has(m.id)) continue;
    if (m.motivoId !== ID_MOTIVO_ENTRADA_COMPRA) continue;
    const coincidencia = m.nota?.trim().match(PATRON_NOTA_COMPRA);
    if (!coincidencia) continue;
    const numero = coincidencia[1].toUpperCase();
    const clave = mapaComprasPorNumero.get(numero) ?? numero;
    const lista = porCompra.get(clave) ?? [];
    lista.push(m);
    porCompra.set(clave, lista);
  }

  for (const [clave, movs] of porCompra) {
    const coincidencia = movs[0]?.nota?.trim().match(PATRON_NOTA_COMPRA);
    const numero = coincidencia?.[1].toUpperCase() ?? clave;
    const compraId = mapaComprasPorNumero.get(numero) ?? null;
    if (compraId) {
      await prisma.movimientoStock.updateMany({
        where: { id: { in: movs.map((m) => m.id) } },
        data: { compraId },
      });
    }
    await crearAuditoriaDesdeMovimientos(movs, {
      tipo: TipoAuditoriaStock.compra,
      titulo: `Compra ${numero}`,
      referencia: numero,
      compraId,
    });
    movs.forEach((m) => procesados.add(m.id));
  }

  const porConteoMasivo = new Map<string, MovimientoSinAuditoria[]>();
  for (const m of sinAuditoria) {
    if (procesados.has(m.id)) continue;
    if (m.motivoId !== ID_MOTIVO_AJUSTE_CONTEO) continue;
    const nota = m.nota?.trim() ?? '';
    if (!nota.startsWith(PREFIJO_NOTA_CONTEO_MASIVO)) continue;
    const minuto = m.fecha.toISOString().slice(0, 16);
    const clave = `conteo-masivo:${minuto}:${m.ejecutadoPorUsuarioId ?? '—'}:${nota}`;
    const lista = porConteoMasivo.get(clave) ?? [];
    lista.push(m);
    porConteoMasivo.set(clave, lista);
  }

  for (const [, movs] of porConteoMasivo) {
    const nota = movs[0]?.nota ?? null;
    await crearAuditoriaDesdeMovimientos(movs, {
      tipo: TipoAuditoriaStock.conteo,
      titulo: `Conteo físico (${movs.length} artículos)`,
      nota,
    });
    movs.forEach((m) => procesados.add(m.id));
  }

  for (const m of sinAuditoria) {
    if (procesados.has(m.id)) continue;

    if (m.motivoId === ID_MOTIVO_ENTRADA_COMPRA) {
      await crearAuditoriaDesdeMovimientos([m], {
        tipo: TipoAuditoriaStock.compra,
        titulo: m.nota?.trim() || 'Entrada de mercadería',
        nota: m.nota,
      });
    } else if (m.motivoId === ID_MOTIVO_AJUSTE_CONTEO) {
      await crearAuditoriaDesdeMovimientos([m], {
        tipo: TipoAuditoriaStock.conteo,
        titulo: `Conteo · ${m.nombreVariante}`,
        nota: m.nota,
      });
    } else {
      await crearAuditoriaDesdeMovimientos([m], {
        tipo: TipoAuditoriaStock.venta,
        titulo: m.numeroVenta ? `Venta ${m.numeroVenta}` : 'Salida por venta',
        referencia: m.numeroVenta,
        ventaId: m.ventaId,
      });
    }
    procesados.add(m.id);
  }

  console.log('Relleno de auditorías completado.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
