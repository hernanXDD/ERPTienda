import {
  CondicionCompra,
  CondicionIvaCliente,
  FormaPagoVenta,
  Prisma,
  PrismaClient,
  TipoAuditoriaStock,
  TipoMovimientoCuentaCorriente,
} from '@prisma/client';
import {
  ID_ESTADO_FACTURACION_FACTURADA,
  ID_ESTADO_FACTURACION_PENDIENTE,
} from './datos/ids-semilla';
import {
  ID_MOTIVO_ENTRADA_COMPRA,
  ID_MOTIVO_SALIDA_VENTA,
} from '../src/comunes/constantes/ids-motivo-stock';
import {
  ID_CLIENTE_001,
  ID_CLIENTE_002,
  ID_CLIENTE_003,
  ID_CLIENTE_004,
  ID_PROVEEDOR_001,
  ID_PROVEEDOR_002,
  ID_PROVEEDOR_003,
  ID_USUARIO_EMPLEADO,
} from './datos/ids-semilla';
import {
  ID_VARIANTE_BUZO_L_GRIS,
  ID_VARIANTE_BUZO_M_GRIS,
  ID_VARIANTE_CAMPERA_M_NEGRO,
  ID_VARIANTE_GORRA_UNICA_NEGRO,
  ID_VARIANTE_JEAN_38_AZUL,
  ID_VARIANTE_JEAN_40_AZUL,
  ID_VARIANTE_PANTALON_40_AZUL,
  ID_VARIANTE_REMERA_L_NEGRO,
  ID_VARIANTE_REMERA_M_NEGRO,
  ID_VARIANTE_REMERA_M_ROJO,
  ID_VARIANTE_REMERA_NINO_10_AZUL,
  ID_VARIANTE_REMERA_OVERSIZE_L_BLANCO,
  ID_VARIANTE_REMERA_S_BLANCO,
  ID_VARIANTE_REMERA_S_NEGRO,
  ID_VARIANTE_SHORT_M_AZUL,
  ID_VARIANTE_ZAPATILLA_40_NEGRO,
  ID_VARIANTE_ZAPATILLA_41_NEGRO,
} from './datos/semilla-catalogo';

const ID_VENTA_DEMO_MARCADOR = '000010';

interface LineaCompraSemilla {
  id: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

interface CompraSemilla {
  id: string;
  numero: string;
  diasAtras: number;
  proveedorId: string;
  nombreProveedorMostrar: string;
  condicionCompra: CondicionCompra;
  observaciones: string;
  lineas: LineaCompraSemilla[];
}

interface LineaVentaSemilla {
  id: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface VentaSemilla {
  id: string;
  numero: string;
  diasAtras: number;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar?: string;
  condicionIvaCliente?: CondicionIvaCliente;
  estadoFacturacionId?: string;
  facturacion?: string;
  formaPago: FormaPagoVenta;
  observaciones: string;
  lineas: LineaVentaSemilla[];
}

interface ClienteFacturacionSemilla {
  documento: string;
  condicionIva: CondicionIvaCliente;
}

export function armarDatosFacturacionVentaSemilla(
  venta: VentaSemilla,
  clientesPorId: ReadonlyMap<string, ClienteFacturacionSemilla>,
): {
  documentoClienteMostrar: string;
  condicionIvaCliente: CondicionIvaCliente;
  estadoFacturacionId: string;
  facturacion: string;
} {
  const cliente = venta.clienteId ? clientesPorId.get(venta.clienteId) : undefined;

  return {
    documentoClienteMostrar: venta.documentoClienteMostrar ?? cliente?.documento ?? '',
    condicionIvaCliente:
      venta.condicionIvaCliente ?? cliente?.condicionIva ?? CondicionIvaCliente.CONSUMIDOR_FINAL,
    estadoFacturacionId:
      venta.estadoFacturacionId ??
      (venta.facturacion?.trim()
        ? ID_ESTADO_FACTURACION_FACTURADA
        : ID_ESTADO_FACTURACION_PENDIENTE),
    facturacion: venta.facturacion ?? '',
  };
}

function fechaHace(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(10 + (dias % 7), 15 + (dias % 5) * 3, 0, 0);
  return fecha;
}

function subtotal(cantidad: number, unitario: number): Prisma.Decimal {
  return new Prisma.Decimal(cantidad * unitario);
}

const comprasSemilla: CompraSemilla[] = [
  {
    id: '000001',
    numero: 'C-00001',
    diasAtras: 42,
    proveedorId: ID_PROVEEDOR_001,
    nombreProveedorMostrar: 'Textiles del Sur SA',
    condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
    observaciones: 'Reposición remeras temporada',
    lineas: [
      {
        id: '000001',
        varianteId: ID_VARIANTE_REMERA_M_NEGRO,
        nombre: 'Remera modal básica · M · Negro',
        cantidad: 40,
        costoUnitario: 7200,
      },
      {
        id: '000002',
        varianteId: ID_VARIANTE_REMERA_S_BLANCO,
        nombre: 'Remera modal básica · S · Blanco',
        cantidad: 30,
        costoUnitario: 7200,
      },
    ],
  },
  {
    id: '000002',
    numero: 'C-00002',
    diasAtras: 38,
    proveedorId: ID_PROVEEDOR_001,
    nombreProveedorMostrar: 'Textiles del Sur SA',
    condicionCompra: CondicionCompra.CONTADO,
    observaciones: '',
    lineas: [
      {
        id: '000003',
        varianteId: ID_VARIANTE_PANTALON_40_AZUL,
        nombre: 'Pantalón mom fit · 40 · Azul',
        cantidad: 25,
        costoUnitario: 14200,
      },
    ],
  },
  {
    id: '000003',
    numero: 'C-00003',
    diasAtras: 35,
    proveedorId: ID_PROVEEDOR_003,
    nombreProveedorMostrar: 'Calzados Patagonia',
    condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
    observaciones: 'Ingreso calzado invierno',
    lineas: [
      {
        id: '000004',
        varianteId: ID_VARIANTE_ZAPATILLA_40_NEGRO,
        nombre: 'Zapatilla urbana clásica · 40 · Negro',
        cantidad: 20,
        costoUnitario: 22800,
      },
      {
        id: '000005',
        varianteId: ID_VARIANTE_ZAPATILLA_41_NEGRO,
        nombre: 'Zapatilla urbana clásica · 41 · Negro',
        cantidad: 18,
        costoUnitario: 22800,
      },
    ],
  },
  {
    id: '000004',
    numero: 'C-00004',
    diasAtras: 30,
    proveedorId: ID_PROVEEDOR_002,
    nombreProveedorMostrar: 'Importadora Rivera',
    condicionCompra: CondicionCompra.CONTADO,
    observaciones: 'Camperas y buzos',
    lineas: [
      {
        id: '000006',
        varianteId: ID_VARIANTE_CAMPERA_M_NEGRO,
        nombre: 'Campera softshell · M · Negro',
        cantidad: 15,
        costoUnitario: 26500,
      },
      {
        id: '000007',
        varianteId: ID_VARIANTE_BUZO_M_GRIS,
        nombre: 'Buzo frisa liso · M · Gris',
        cantidad: 22,
        costoUnitario: 11800,
      },
    ],
  },
  {
    id: '000005',
    numero: 'C-00005',
    diasAtras: 27,
    proveedorId: ID_PROVEEDOR_001,
    nombreProveedorMostrar: 'Textiles del Sur SA',
    condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
    observaciones: '',
    lineas: [
      {
        id: '000008',
        varianteId: ID_VARIANTE_GORRA_UNICA_NEGRO,
        nombre: 'Gorra clásica ajustable · Único · Negro',
        cantidad: 50,
        costoUnitario: 3200,
      },
    ],
  },
  {
    id: '000006',
    numero: 'C-00006',
    diasAtras: 24,
    proveedorId: ID_PROVEEDOR_002,
    nombreProveedorMostrar: 'Importadora Rivera',
    condicionCompra: CondicionCompra.CONTADO,
    observaciones: 'Jean y oversize',
    lineas: [
      {
        id: '000009',
        varianteId: ID_VARIANTE_JEAN_38_AZUL,
        nombre: 'Jean slim fit · 38 · Azul',
        cantidad: 20,
        costoUnitario: 15600,
      },
      {
        id: '000010',
        varianteId: ID_VARIANTE_REMERA_OVERSIZE_L_BLANCO,
        nombre: 'Remera oversize algodón · L · Blanco',
        cantidad: 28,
        costoUnitario: 8400,
      },
    ],
  },
  {
    id: '000007',
    numero: 'C-00007',
    diasAtras: 20,
    proveedorId: ID_PROVEEDOR_001,
    nombreProveedorMostrar: 'Textiles del Sur SA',
    condicionCompra: CondicionCompra.CONTADO,
    observaciones: 'Shorts deportivos',
    lineas: [
      {
        id: '000011',
        varianteId: ID_VARIANTE_SHORT_M_AZUL,
        nombre: 'Short running dry-fit · M · Azul',
        cantidad: 35,
        costoUnitario: 6800,
      },
    ],
  },
  {
    id: '000008',
    numero: 'C-00008',
    diasAtras: 16,
    proveedorId: ID_PROVEEDOR_003,
    nombreProveedorMostrar: 'Calzados Patagonia',
    condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
    observaciones: '',
    lineas: [
      {
        id: '000012',
        varianteId: ID_VARIANTE_JEAN_40_AZUL,
        nombre: 'Jean slim fit · 40 · Azul',
        cantidad: 18,
        costoUnitario: 15600,
      },
      {
        id: '000013',
        varianteId: ID_VARIANTE_BUZO_L_GRIS,
        nombre: 'Buzo frisa liso · L · Gris',
        cantidad: 16,
        costoUnitario: 11800,
      },
    ],
  },
  {
    id: '000009',
    numero: 'C-00009',
    diasAtras: 12,
    proveedorId: ID_PROVEEDOR_001,
    nombreProveedorMostrar: 'Textiles del Sur SA',
    condicionCompra: CondicionCompra.CONTADO,
    observaciones: 'Línea infantil',
    lineas: [
      {
        id: '000014',
        varianteId: ID_VARIANTE_REMERA_NINO_10_AZUL,
        nombre: 'Remera niño estampada · 10 · Azul',
        cantidad: 40,
        costoUnitario: 5100,
      },
    ],
  },
  {
    id: '000010',
    numero: 'C-00010',
    diasAtras: 8,
    proveedorId: ID_PROVEEDOR_002,
    nombreProveedorMostrar: 'Importadora Rivera',
    condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
    observaciones: 'Cierre de mes',
    lineas: [
      {
        id: '000015',
        varianteId: ID_VARIANTE_REMERA_L_NEGRO,
        nombre: 'Remera modal básica · L · Negro',
        cantidad: 24,
        costoUnitario: 7200,
      },
      {
        id: '000016',
        varianteId: ID_VARIANTE_REMERA_M_ROJO,
        nombre: 'Remera modal básica · M · Rojo',
        cantidad: 20,
        costoUnitario: 7200,
      },
    ],
  },
];

const ventasSemilla: VentaSemilla[] = [
  {
    id: '000001',
    numero: 'V-00001',
    diasAtras: 28,
    clienteId: ID_CLIENTE_002,
    nombreClienteMostrar: 'Lucía Fernández',
    estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
    formaPago: FormaPagoVenta.EFECTIVO,
    observaciones: '',
    lineas: [
      {
        id: '000001',
        varianteId: ID_VARIANTE_REMERA_S_NEGRO,
        nombre: 'Remera modal básica · S · Negro',
        cantidad: 2,
        precioUnitario: 15900,
      },
      {
        id: '000002',
        varianteId: ID_VARIANTE_GORRA_UNICA_NEGRO,
        nombre: 'Gorra clásica ajustable · Único · Negro',
        cantidad: 1,
        precioUnitario: 8900,
      },
    ],
  },
  {
    id: '000002',
    numero: 'V-00002',
    diasAtras: 25,
    clienteId: null,
    nombreClienteMostrar: 'Consumidor final — 20.456.789',
    documentoClienteMostrar: '20.456.789',
    condicionIvaCliente: CondicionIvaCliente.CONSUMIDOR_FINAL,
    estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
    formaPago: FormaPagoVenta.DEBITO,
    observaciones: '',
    lineas: [
      {
        id: '000003',
        varianteId: ID_VARIANTE_ZAPATILLA_41_NEGRO,
        nombre: 'Zapatilla urbana clásica · 41 · Negro',
        cantidad: 1,
        precioUnitario: 45900,
      },
    ],
  },
  {
    id: '000003',
    numero: 'V-00003',
    diasAtras: 22,
    clienteId: ID_CLIENTE_001,
    nombreClienteMostrar: 'María García',
    estadoFacturacionId: ID_ESTADO_FACTURACION_FACTURADA,
    facturacion: '0001-00000089',
    formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
    observaciones: 'Retira en mostrador',
    lineas: [
      {
        id: '000004',
        varianteId: ID_VARIANTE_PANTALON_40_AZUL,
        nombre: 'Pantalón mom fit · 40 · Azul',
        cantidad: 1,
        precioUnitario: 28900,
      },
      {
        id: '000005',
        varianteId: ID_VARIANTE_REMERA_M_NEGRO,
        nombre: 'Remera modal básica · M · Negro',
        cantidad: 2,
        precioUnitario: 15900,
      },
    ],
  },
  {
    id: '000004',
    numero: 'V-00004',
    diasAtras: 19,
    clienteId: ID_CLIENTE_003,
    nombreClienteMostrar: 'Ana Boutique (mayorista)',
    estadoFacturacionId: ID_ESTADO_FACTURACION_FACTURADA,
    facturacion: '0001-00000090',
    formaPago: FormaPagoVenta.TRANSFERENCIA,
    observaciones: 'Pedido mayorista parcial',
    lineas: [
      {
        id: '000006',
        varianteId: ID_VARIANTE_REMERA_M_NEGRO,
        nombre: 'Remera modal básica · M · Negro',
        cantidad: 6,
        precioUnitario: 14900,
      },
      {
        id: '000007',
        varianteId: ID_VARIANTE_REMERA_L_NEGRO,
        nombre: 'Remera modal básica · L · Negro',
        cantidad: 4,
        precioUnitario: 14900,
      },
    ],
  },
  {
    id: '000005',
    numero: 'V-00005',
    diasAtras: 16,
    clienteId: null,
    nombreClienteMostrar: 'Consumidor final — 35.678.901',
    documentoClienteMostrar: '35.678.901',
    condicionIvaCliente: CondicionIvaCliente.CONSUMIDOR_FINAL,
    estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
    formaPago: FormaPagoVenta.CREDITO,
    observaciones: '',
    lineas: [
      {
        id: '000008',
        varianteId: ID_VARIANTE_CAMPERA_M_NEGRO,
        nombre: 'Campera softshell · M · Negro',
        cantidad: 1,
        precioUnitario: 52900,
      },
    ],
  },
  {
    id: '000006',
    numero: 'V-00006',
    diasAtras: 13,
    clienteId: ID_CLIENTE_004,
    nombreClienteMostrar: 'Construcciones San José SA',
    estadoFacturacionId: ID_ESTADO_FACTURACION_FACTURADA,
    facturacion: '0001-00000091',
    formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
    observaciones: 'Uniformes personal',
    lineas: [
      {
        id: '000009',
        varianteId: ID_VARIANTE_BUZO_M_GRIS,
        nombre: 'Buzo frisa liso · M · Gris',
        cantidad: 5,
        precioUnitario: 23900,
      },
      {
        id: '000010',
        varianteId: ID_VARIANTE_JEAN_40_AZUL,
        nombre: 'Jean slim fit · 40 · Azul',
        cantidad: 3,
        precioUnitario: 31900,
      },
    ],
  },
  {
    id: '000007',
    numero: 'V-00007',
    diasAtras: 10,
    clienteId: ID_CLIENTE_002,
    nombreClienteMostrar: 'Lucía Fernández',
    estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
    formaPago: FormaPagoVenta.EFECTIVO,
    observaciones: '',
    lineas: [
      {
        id: '000011',
        varianteId: ID_VARIANTE_SHORT_M_AZUL,
        nombre: 'Short running dry-fit · M · Azul',
        cantidad: 2,
        precioUnitario: 16900,
      },
      {
        id: '000012',
        varianteId: ID_VARIANTE_REMERA_OVERSIZE_L_BLANCO,
        nombre: 'Remera oversize algodón · L · Blanco',
        cantidad: 1,
        precioUnitario: 18900,
      },
    ],
  },
  {
    id: '000008',
    numero: 'V-00008',
    diasAtras: 7,
    clienteId: null,
    nombreClienteMostrar: 'Consumidor final — 41.222.333',
    documentoClienteMostrar: '41.222.333',
    condicionIvaCliente: CondicionIvaCliente.CONSUMIDOR_FINAL,
    estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
    formaPago: FormaPagoVenta.DEBITO,
    observaciones: '',
    lineas: [
      {
        id: '000013',
        varianteId: ID_VARIANTE_REMERA_NINO_10_AZUL,
        nombre: 'Remera niño estampada · 10 · Azul',
        cantidad: 2,
        precioUnitario: 12900,
      },
      {
        id: '000014',
        varianteId: ID_VARIANTE_GORRA_UNICA_NEGRO,
        nombre: 'Gorra clásica ajustable · Único · Negro',
        cantidad: 1,
        precioUnitario: 8900,
      },
    ],
  },
  {
    id: '000009',
    numero: 'V-00009',
    diasAtras: 4,
    clienteId: ID_CLIENTE_001,
    nombreClienteMostrar: 'María García',
    estadoFacturacionId: ID_ESTADO_FACTURACION_FACTURADA,
    facturacion: '0001-00000092',
    formaPago: FormaPagoVenta.TRANSFERENCIA,
    observaciones: '',
    lineas: [
      {
        id: '000015',
        varianteId: ID_VARIANTE_JEAN_38_AZUL,
        nombre: 'Jean slim fit · 38 · Azul',
        cantidad: 1,
        precioUnitario: 31900,
      },
    ],
  },
  {
    id: '000010',
    numero: 'V-00010',
    diasAtras: 1,
    clienteId: ID_CLIENTE_003,
    nombreClienteMostrar: 'Ana Boutique (mayorista)',
    estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
    formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
    observaciones: 'Cierra pedido semanal',
    lineas: [
      {
        id: '000016',
        varianteId: ID_VARIANTE_REMERA_M_ROJO,
        nombre: 'Remera modal básica · M · Rojo',
        cantidad: 8,
        precioUnitario: 14500,
      },
      {
        id: '000017',
        varianteId: ID_VARIANTE_BUZO_L_GRIS,
        nombre: 'Buzo frisa liso · L · Gris',
        cantidad: 3,
        precioUnitario: 24900,
      },
    ],
  },
];

export { ventasSemilla };

async function aplicarEntradaCompra(
  tx: Prisma.TransactionClient,
  params: {
    varianteId: string;
    nombreVariante: string;
    cantidad: number;
    compraId: string;
    auditoriaId: string;
    movimientoId: string;
    fecha: Date;
  },
): Promise<void> {
  const stock = await tx.stockVariante.findUniqueOrThrow({
    where: { varianteId: params.varianteId },
  });
  const nuevo = stock.cantidadActual + params.cantidad;
  await tx.stockVariante.update({
    where: { varianteId: params.varianteId },
    data: { cantidadActual: nuevo },
  });
  await tx.movimientoStock.create({
    data: {
      id: params.movimientoId,
      varianteId: params.varianteId,
      nombreVariante: params.nombreVariante,
      motivoId: ID_MOTIVO_ENTRADA_COMPRA,
      cantidadVariacion: params.cantidad,
      stockResultante: nuevo,
      compraId: params.compraId,
      auditoriaStockId: params.auditoriaId,
      ejecutadoPorUsuarioId: ID_USUARIO_EMPLEADO,
      fecha: params.fecha,
    },
  });
}

async function aplicarSalidaVenta(
  tx: Prisma.TransactionClient,
  params: {
    varianteId: string;
    nombreVariante: string;
    cantidad: number;
    ventaId: string;
    numeroVenta: string;
    auditoriaId: string;
    movimientoId: string;
    fecha: Date;
  },
): Promise<void> {
  const stock = await tx.stockVariante.findUniqueOrThrow({
    where: { varianteId: params.varianteId },
  });
  const nuevo = stock.cantidadActual - params.cantidad;
  await tx.stockVariante.update({
    where: { varianteId: params.varianteId },
    data: { cantidadActual: nuevo },
  });
  await tx.movimientoStock.create({
    data: {
      id: params.movimientoId,
      fecha: params.fecha,
      varianteId: params.varianteId,
      nombreVariante: params.nombreVariante,
      motivoId: ID_MOTIVO_SALIDA_VENTA,
      cantidadVariacion: -params.cantidad,
      stockResultante: nuevo,
      ventaId: params.ventaId,
      numeroVenta: params.numeroVenta,
      auditoriaStockId: params.auditoriaId,
      ejecutadoPorUsuarioId: ID_USUARIO_EMPLEADO,
    },
  });
}

function totalCompra(lineas: LineaCompraSemilla[]): Prisma.Decimal {
  return lineas.reduce(
    (acc, ln) => acc.add(subtotal(ln.cantidad, ln.costoUnitario)),
    new Prisma.Decimal(0),
  );
}

function totalVenta(lineas: LineaVentaSemilla[]): Prisma.Decimal {
  return lineas.reduce(
    (acc, ln) => acc.add(subtotal(ln.cantidad, ln.precioUnitario)),
    new Prisma.Decimal(0),
  );
}

export async function sembrarVentasYComprasDemo(prisma: PrismaClient): Promise<void> {
  const ventasYa = await prisma.venta.findUnique({ where: { id: ID_VENTA_DEMO_MARCADOR } });
  if (ventasYa) {
    // eslint-disable-next-line no-console
    console.log('Ventas y compras demo ya presentes; se omite transacciones de semilla.');
    return;
  }

  const comprasYa = await prisma.compra.findUnique({ where: { id: '000010' } });

  const ultimoMovimiento = await prisma.movimientoStock.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  let idMovimiento = ultimoMovimiento ? parseInt(ultimoMovimiento.id, 10) : 0;
  const siguienteMovimiento = (): string => {
    idMovimiento += 1;
    return String(idMovimiento).padStart(6, '0');
  };

  await prisma.$transaction(async (tx) => {
    if (!comprasYa) {
      for (const [indice, compra] of comprasSemilla.entries()) {
        const compraExistente = await tx.compra.findUnique({ where: { id: compra.id } });
        if (compraExistente) continue;

        const fecha = fechaHace(compra.diasAtras);
        const total = totalCompra(compra.lineas);
        const idAuditoria = String(indice + 51).padStart(6, '0');

        await tx.compra.create({
          data: {
            id: compra.id,
            numero: compra.numero,
            fecha,
            proveedorId: compra.proveedorId,
            nombreProveedorMostrar: compra.nombreProveedorMostrar,
            condicionCompra: compra.condicionCompra,
            total,
            observaciones: compra.observaciones,
            lineas: {
              create: compra.lineas.map((ln) => ({
                id: ln.id,
                varianteId: ln.varianteId,
                nombre: ln.nombre,
                cantidad: ln.cantidad,
                costoUnitario: new Prisma.Decimal(ln.costoUnitario),
                subtotal: subtotal(ln.cantidad, ln.costoUnitario),
              })),
            },
          },
        });

        await tx.auditoriaStock.create({
          data: {
            id: idAuditoria,
            tipo: TipoAuditoriaStock.compra,
            fecha,
            titulo: `Compra ${compra.numero}`,
            referencia: compra.numero,
            compraId: compra.id,
            ejecutadoPorUsuarioId: ID_USUARIO_EMPLEADO,
            variacionNeta: compra.lineas.reduce((s, ln) => s + ln.cantidad, 0),
            cantidadMovimientos: compra.lineas.length,
          },
        });

        for (const ln of compra.lineas) {
          await aplicarEntradaCompra(tx, {
            varianteId: ln.varianteId,
            nombreVariante: ln.nombre,
            cantidad: ln.cantidad,
            compraId: compra.id,
            auditoriaId: idAuditoria,
            movimientoId: siguienteMovimiento(),
            fecha,
          });
        }
      }
    }

    let idMovimientoCc = 0;
    const ultimoCc = await tx.movimientoCuentaCorriente.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (ultimoCc) idMovimientoCc = parseInt(ultimoCc.id, 10);

    const clientesFacturacion = await tx.cliente.findMany({
      select: { id: true, documento: true, condicionIva: true },
    });
    const clientesPorId = new Map(
      clientesFacturacion.map((cliente) => [
        cliente.id,
        { documento: cliente.documento, condicionIva: cliente.condicionIva },
      ]),
    );

    for (const [indice, venta] of ventasSemilla.entries()) {
      const datosFacturacion = armarDatosFacturacionVentaSemilla(venta, clientesPorId);
      const ventaExistente = await tx.venta.findUnique({ where: { id: venta.id } });
      if (ventaExistente) {
        await tx.venta.update({
          where: { id: venta.id },
          data: {
            nombreClienteMostrar: venta.nombreClienteMostrar,
            ...datosFacturacion,
          },
        });
        continue;
      }

      const fecha = fechaHace(venta.diasAtras);
      const total = totalVenta(venta.lineas);
      const idAuditoria = String(indice + 61).padStart(6, '0');

      await tx.venta.create({
        data: {
          id: venta.id,
          numero: venta.numero,
          fecha,
          clienteId: venta.clienteId,
          nombreClienteMostrar: venta.nombreClienteMostrar,
          documentoClienteMostrar: datosFacturacion.documentoClienteMostrar,
          condicionIvaCliente: datosFacturacion.condicionIvaCliente,
          estadoFacturacionId: datosFacturacion.estadoFacturacionId,
          facturacion: datosFacturacion.facturacion,
          formaPago: venta.formaPago,
          total,
          observaciones: venta.observaciones,
          lineas: {
            create: venta.lineas.map((ln) => ({
              id: ln.id,
              varianteId: ln.varianteId,
              nombre: ln.nombre,
              cantidad: ln.cantidad,
              precioUnitario: new Prisma.Decimal(ln.precioUnitario),
              subtotal: subtotal(ln.cantidad, ln.precioUnitario),
            })),
          },
        },
      });

      await tx.auditoriaStock.create({
        data: {
          id: idAuditoria,
          tipo: TipoAuditoriaStock.venta,
          fecha,
          titulo: `Venta ${venta.numero}`,
          referencia: venta.numero,
          ventaId: venta.id,
          ejecutadoPorUsuarioId: ID_USUARIO_EMPLEADO,
          variacionNeta: -venta.lineas.reduce((s, ln) => s + ln.cantidad, 0),
          cantidadMovimientos: venta.lineas.length,
        },
      });

      for (const ln of venta.lineas) {
        await aplicarSalidaVenta(tx, {
          varianteId: ln.varianteId,
          nombreVariante: ln.nombre,
          cantidad: ln.cantidad,
          ventaId: venta.id,
          numeroVenta: venta.numero,
          auditoriaId: idAuditoria,
          movimientoId: siguienteMovimiento(),
          fecha,
        });
      }

      if (venta.formaPago === FormaPagoVenta.CUENTA_CORRIENTE && venta.clienteId) {
        idMovimientoCc += 1;
        await tx.movimientoCuentaCorriente.create({
          data: {
            id: String(idMovimientoCc).padStart(6, '0'),
            clienteId: venta.clienteId,
            fecha,
            tipoMovimiento: TipoMovimientoCuentaCorriente.cargo,
            importe: total,
            descripcion: `Venta ${venta.numero}`,
            registradoPorUsuarioId: ID_USUARIO_EMPLEADO,
          },
        });
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('Semilla: 10 compras y 10 ventas de demostración creadas.');
}
