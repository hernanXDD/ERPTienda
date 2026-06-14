/**
 * Semilla de datos de prueba para desarrollo local.
 * Requiere migraciones aplicadas. Ejecutar: npm run db:seed:demo
 *
 * Incluye catálogo, stock, clientes, proveedores, compras, ventas y
 * movimientos de cuenta corriente (clientes y proveedores).
 */
import {
  CondicionCompra,
  CondicionIvaCliente,
  FormaPagoVenta,
  Prisma,
  PrismaClient,
  TipoAuditoriaStock,
  TipoMovimientoCuentaCorriente,
} from '@prisma/client';
import { ID_CONFIGURACION_SISTEMA } from '../src/comunes/constantes/id-configuracion-sistema';
import { ID_NEGOCIO } from '../src/comunes/constantes/id-negocio';
import {
  ID_MOTIVO_ENTRADA_COMPRA,
  ID_MOTIVO_SALIDA_VENTA,
} from '../src/comunes/constantes/ids-motivo-stock';
import {
  ID_ESTADO_FACTURACION_FACTURADA,
  ID_ESTADO_FACTURACION_PENDIENTE,
  ID_USUARIO_ADMIN,
} from './datos/ids-semilla';
import {
  ID_AUDITORIA_COMPRA_1,
  ID_AUDITORIA_COMPRA_2,
  ID_AUDITORIA_VENTA_1,
  ID_AUDITORIA_VENTA_2,
  ID_AUDITORIA_VENTA_3,
  ID_CATEGORIA_PANTALON,
  ID_CATEGORIA_REMERA,
  ID_CLIENTE_COMERCIO,
  ID_CLIENTE_JUAN,
  ID_CLIENTE_MARIA,
  ID_COMPRA_CONTADO,
  ID_COMPRA_CUENTA,
  ID_COMPRA_LINEA_1,
  ID_COMPRA_LINEA_2,
  ID_COMPRA_LINEA_3,
  ID_MOV_CC_CLIENTE_CARGO,
  ID_MOV_CC_CLIENTE_PAGO,
  ID_MOV_CC_PROVEEDOR_CARGO,
  ID_MOV_CC_PROVEEDOR_PAGO,
  ID_MOV_STOCK_1,
  ID_MOV_STOCK_2,
  ID_MOV_STOCK_3,
  ID_MOV_STOCK_4,
  ID_MOV_STOCK_5,
  ID_MOV_STOCK_6,
  ID_PRODUCTO_JEAN,
  ID_PRODUCTO_REMERA,
  ID_PROVEEDOR_CONTADO,
  ID_PROVEEDOR_TEXTIL,
  ID_VARIANTE_JEAN_42_AZUL,
  ID_VARIANTE_JEAN_44_NEGRO,
  ID_VARIANTE_REMERA_L_AZUL,
  ID_VARIANTE_REMERA_M_NEGRO,
  ID_VENTA_CUENTA,
  ID_VENTA_EFECTIVO,
  ID_VENTA_LINEA_1,
  ID_VENTA_LINEA_2,
  ID_VENTA_LINEA_3,
  ID_VENTA_TRANSFERENCIA,
  IDS_DEMO_CATEGORIAS,
  IDS_DEMO_CLIENTES,
  IDS_DEMO_COMPRAS,
  IDS_DEMO_PRODUCTOS,
  IDS_DEMO_PROVEEDORES,
  IDS_DEMO_VARIANTES,
  IDS_DEMO_VENTAS,
} from './datos/ids-semilla-demo';
import { sembrarEstadosFacturacion } from './semilla-estados-facturacion';
import { sembrarMotivosStock } from './semilla-motivos-stock';
import { sembrarUsuarioAdministrador } from './semilla-usuario-admin';

const prisma = new PrismaClient();

function diasAtras(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(12, 0, 0, 0);
  return fecha;
}

function decimal(valor: number): Prisma.Decimal {
  return new Prisma.Decimal(valor);
}

const NUMEROS_VENTAS_DEMO = ['V-00001', 'V-00002', 'V-00003'] as const;
const NUMEROS_COMPRAS_DEMO = ['C-00001', 'C-00002'] as const;

async function limpiarDatosDemo(): Promise<void> {
  const ventasExistentes = await prisma.venta.findMany({
    where: { numero: { in: [...NUMEROS_VENTAS_DEMO] } },
    select: { id: true },
  });
  const comprasExistentes = await prisma.compra.findMany({
    where: { numero: { in: [...NUMEROS_COMPRAS_DEMO] } },
    select: { id: true },
  });

  const idsVentas = [
    ...new Set([...IDS_DEMO_VENTAS, ...ventasExistentes.map((venta) => venta.id)]),
  ];
  const idsCompras = [
    ...new Set([...IDS_DEMO_COMPRAS, ...comprasExistentes.map((compra) => compra.id)]),
  ];

  await prisma.movimientoCuentaCorriente.deleteMany({
    where: {
      OR: [
        { clienteId: { in: [...IDS_DEMO_CLIENTES] } },
        { id: { in: [ID_MOV_CC_CLIENTE_CARGO, ID_MOV_CC_CLIENTE_PAGO] } },
      ],
    },
  });
  await prisma.movimientoCuentaCorrienteProveedor.deleteMany({
    where: {
      OR: [
        { proveedorId: { in: [...IDS_DEMO_PROVEEDORES] } },
        { id: { in: [ID_MOV_CC_PROVEEDOR_CARGO, ID_MOV_CC_PROVEEDOR_PAGO] } },
      ],
    },
  });
  await prisma.movimientoStock.deleteMany({
    where: {
      OR: [
        { ventaId: { in: idsVentas } },
        { compraId: { in: idsCompras } },
        { numeroVenta: { in: [...NUMEROS_VENTAS_DEMO] } },
        { id: { in: [ID_MOV_STOCK_1, ID_MOV_STOCK_2, ID_MOV_STOCK_3, ID_MOV_STOCK_4, ID_MOV_STOCK_5, ID_MOV_STOCK_6] } },
      ],
    },
  });
  await prisma.ventaLinea.deleteMany({ where: { ventaId: { in: idsVentas } } });
  await prisma.venta.deleteMany({
    where: { OR: [{ id: { in: idsVentas } }, { numero: { in: [...NUMEROS_VENTAS_DEMO] } }] },
  });
  await prisma.compraLinea.deleteMany({ where: { compraId: { in: idsCompras } } });
  await prisma.compra.deleteMany({
    where: { OR: [{ id: { in: idsCompras } }, { numero: { in: [...NUMEROS_COMPRAS_DEMO] } }] },
  });
  await prisma.auditoriaStock.deleteMany({
    where: {
      OR: [
        {
          id: {
            in: [
              ID_AUDITORIA_COMPRA_1,
              ID_AUDITORIA_COMPRA_2,
              ID_AUDITORIA_VENTA_1,
              ID_AUDITORIA_VENTA_2,
              ID_AUDITORIA_VENTA_3,
            ],
          },
        },
        { referencia: { in: [...NUMEROS_VENTAS_DEMO, ...NUMEROS_COMPRAS_DEMO] } },
        { ventaId: { in: idsVentas } },
        { compraId: { in: idsCompras } },
      ],
    },
  });
  await prisma.stockVariante.deleteMany({ where: { varianteId: { in: [...IDS_DEMO_VARIANTES] } } });
  await prisma.variante.deleteMany({ where: { id: { in: [...IDS_DEMO_VARIANTES] } } });
  await prisma.producto.deleteMany({ where: { id: { in: [...IDS_DEMO_PRODUCTOS] } } });
  await prisma.categoria.deleteMany({ where: { id: { in: [...IDS_DEMO_CATEGORIAS] } } });
  await prisma.cliente.deleteMany({ where: { id: { in: [...IDS_DEMO_CLIENTES] } } });
  await prisma.proveedor.deleteMany({ where: { id: { in: [...IDS_DEMO_PROVEEDORES] } } });
}

async function sembrarNegocioYConfiguracion(): Promise<void> {
  await prisma.negocio.upsert({
    where: { id: ID_NEGOCIO },
    create: {
      id: ID_NEGOCIO,
      nombre: 'Tienda Demo ERPTienda',
      cuit: '30-71234567-8',
      correoElectronico: 'contacto@tiendademo.local',
      telefono: '11 4444-5555',
      direccion: 'Av. Corrientes 1200',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1043',
    },
    update: {
      nombre: 'Tienda Demo ERPTienda',
      cuit: '30-71234567-8',
      correoElectronico: 'contacto@tiendademo.local',
      telefono: '11 4444-5555',
      direccion: 'Av. Corrientes 1200',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1043',
    },
  });

  await prisma.configuracionSistema.upsert({
    where: { id: ID_CONFIGURACION_SISTEMA },
    create: {
      id: ID_CONFIGURACION_SISTEMA,
      maximoCuentaCorriente: decimal(500000),
      porcentajeGananciaSugerida: decimal(35),
      diasDeudaCuentaCorriente: 30,
      stockMinimoAlerta: 5,
      movimientoManualStockHabilitado: true,
    },
    update: {
      maximoCuentaCorriente: decimal(500000),
      porcentajeGananciaSugerida: decimal(35),
      diasDeudaCuentaCorriente: 30,
      stockMinimoAlerta: 5,
      movimientoManualStockHabilitado: true,
    },
  });
}

async function sembrarCatalogoYStock(): Promise<void> {
  await prisma.categoria.createMany({
    data: [
      { id: ID_CATEGORIA_REMERA, nombre: 'Remeras', descripcion: 'Indumentaria superior' },
      { id: ID_CATEGORIA_PANTALON, nombre: 'Pantalones', descripcion: 'Jeans y similares' },
    ],
  });

  await prisma.producto.createMany({
    data: [
      {
        id: ID_PRODUCTO_REMERA,
        nombre: 'Remera básica algodón',
        marca: 'Urban',
        descripcion: 'Remera unisex para mostrador',
        categoriaId: ID_CATEGORIA_REMERA,
        precioVenta: decimal(5000),
      },
      {
        id: ID_PRODUCTO_JEAN,
        nombre: 'Jean clásico',
        marca: 'Denim Co.',
        descripcion: 'Jean recto tiro medio',
        categoriaId: ID_CATEGORIA_PANTALON,
        precioVenta: decimal(12000),
      },
    ],
  });

  await prisma.variante.createMany({
    data: [
      {
        id: ID_VARIANTE_REMERA_M_NEGRO,
        productoId: ID_PRODUCTO_REMERA,
        talle: 'M',
        color: 'Negro',
        codigoBarras: '7790001001001',
      },
      {
        id: ID_VARIANTE_REMERA_L_AZUL,
        productoId: ID_PRODUCTO_REMERA,
        talle: 'L',
        color: 'Azul',
        codigoBarras: '7790001001002',
      },
      {
        id: ID_VARIANTE_JEAN_42_AZUL,
        productoId: ID_PRODUCTO_JEAN,
        talle: '42',
        color: 'Azul',
        codigoBarras: '7790002001001',
      },
      {
        id: ID_VARIANTE_JEAN_44_NEGRO,
        productoId: ID_PRODUCTO_JEAN,
        talle: '44',
        color: 'Negro',
        codigoBarras: '7790002001002',
      },
    ],
  });

  await prisma.stockVariante.createMany({
    data: IDS_DEMO_VARIANTES.map((varianteId) => ({
      varianteId,
      cantidadActual: 0,
    })),
  });
}

async function sembrarClientesYProveedores(): Promise<void> {
  await prisma.cliente.createMany({
    data: [
      {
        id: ID_CLIENTE_MARIA,
        nombre: 'María Gómez',
        documento: '27-30111222-3',
        correoElectronico: 'maria.gomez@mail.demo',
        telefonoPrincipal: '11 5555-1001',
        condicionIva: CondicionIvaCliente.CONSUMIDOR_FINAL,
        limiteCompraCuentaCorriente: decimal(80000),
        cuentaCorrienteHabilitada: true,
      },
      {
        id: ID_CLIENTE_JUAN,
        nombre: 'Juan Pérez',
        documento: '20-28444555-6',
        correoElectronico: 'juan.perez@mail.demo',
        telefonoPrincipal: '11 5555-1002',
        condicionIva: CondicionIvaCliente.CONSUMIDOR_FINAL,
        cuentaCorrienteHabilitada: false,
      },
      {
        id: ID_CLIENTE_COMERCIO,
        nombre: 'Comercio San Martín SRL',
        documento: '30-70999888-1',
        correoElectronico: 'compras@sanmartin.demo',
        telefonoPrincipal: '11 5555-1003',
        condicionIva: CondicionIvaCliente.RESPONSABLE_INSCRIPTO,
        limiteCompraCuentaCorriente: decimal(250000),
        cuentaCorrienteHabilitada: true,
      },
    ],
  });

  await prisma.proveedor.createMany({
    data: [
      {
        id: ID_PROVEEDOR_TEXTIL,
        nombre: 'Textil Norte SA',
        documento: '30-70111222-4',
        correoElectronico: 'ventas@textilnorte.demo',
        telefonoPrincipal: '11 4444-2001',
        direccion: 'Parque Industrial 450',
        limiteCreditoCompras: decimal(200000),
        comprasCreditoHabilitadas: true,
      },
      {
        id: ID_PROVEEDOR_CONTADO,
        nombre: 'Mayorista Rápido',
        documento: '30-70222333-5',
        correoElectronico: 'pedidos@mayoristarapido.demo',
        telefonoPrincipal: '11 4444-2002',
        comprasCreditoHabilitadas: false,
      },
    ],
  });
}

async function sembrarCompras(): Promise<void> {
  const fechaCompra1 = diasAtras(20);
  const fechaCompra2 = diasAtras(10);

  await prisma.compra.create({
    data: {
      id: ID_COMPRA_CONTADO,
      numero: 'C-00001',
      fecha: fechaCompra1,
      proveedorId: ID_PROVEEDOR_CONTADO,
      nombreProveedorMostrar: 'Mayorista Rápido',
      condicionCompra: CondicionCompra.CONTADO,
      total: decimal(45000),
      observaciones: 'Reposición remeras contado',
      lineas: {
        create: [
          {
            id: ID_COMPRA_LINEA_1,
            varianteId: ID_VARIANTE_REMERA_M_NEGRO,
            nombre: 'Remera básica algodón · M · Negro',
            cantidad: 10,
            costoUnitario: decimal(3000),
            subtotal: decimal(30000),
          },
          {
            id: ID_COMPRA_LINEA_2,
            varianteId: ID_VARIANTE_REMERA_L_AZUL,
            nombre: 'Remera básica algodón · L · Azul',
            cantidad: 5,
            costoUnitario: decimal(3000),
            subtotal: decimal(15000),
          },
        ],
      },
    },
  });

  await prisma.compra.create({
    data: {
      id: ID_COMPRA_CUENTA,
      numero: 'C-00002',
      fecha: fechaCompra2,
      proveedorId: ID_PROVEEDOR_TEXTIL,
      nombreProveedorMostrar: 'Textil Norte SA',
      condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
      total: decimal(45000),
      observaciones: 'Ingreso jeans a cuenta proveedor',
      lineas: {
        create: [
          {
            id: ID_COMPRA_LINEA_3,
            varianteId: ID_VARIANTE_JEAN_42_AZUL,
            nombre: 'Jean clásico · 42 · Azul',
            cantidad: 20,
            costoUnitario: decimal(2250),
            subtotal: decimal(45000),
          },
        ],
      },
    },
  });

  await prisma.auditoriaStock.createMany({
    data: [
      {
        id: ID_AUDITORIA_COMPRA_1,
        tipo: TipoAuditoriaStock.compra,
        fecha: fechaCompra1,
        titulo: 'Compra C-00001',
        referencia: 'C-00001',
        compraId: ID_COMPRA_CONTADO,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
        variacionNeta: 15,
        cantidadMovimientos: 2,
      },
      {
        id: ID_AUDITORIA_COMPRA_2,
        tipo: TipoAuditoriaStock.compra,
        fecha: fechaCompra2,
        titulo: 'Compra C-00002',
        referencia: 'C-00002',
        compraId: ID_COMPRA_CUENTA,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
        variacionNeta: 20,
        cantidadMovimientos: 1,
      },
    ],
  });

  await prisma.stockVariante.update({
    where: { varianteId: ID_VARIANTE_REMERA_M_NEGRO },
    data: { cantidadActual: 10 },
  });
  await prisma.stockVariante.update({
    where: { varianteId: ID_VARIANTE_REMERA_L_AZUL },
    data: { cantidadActual: 5 },
  });
  await prisma.stockVariante.update({
    where: { varianteId: ID_VARIANTE_JEAN_42_AZUL },
    data: { cantidadActual: 20 },
  });

  await prisma.movimientoStock.createMany({
    data: [
      {
        id: ID_MOV_STOCK_1,
        fecha: fechaCompra1,
        varianteId: ID_VARIANTE_REMERA_M_NEGRO,
        nombreVariante: 'Remera básica algodón · M · Negro',
        motivoId: ID_MOTIVO_ENTRADA_COMPRA,
        cantidadVariacion: 10,
        stockResultante: 10,
        compraId: ID_COMPRA_CONTADO,
        auditoriaStockId: ID_AUDITORIA_COMPRA_1,
        nota: 'Compra C-00001',
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
      },
      {
        id: ID_MOV_STOCK_2,
        fecha: fechaCompra1,
        varianteId: ID_VARIANTE_REMERA_L_AZUL,
        nombreVariante: 'Remera básica algodón · L · Azul',
        motivoId: ID_MOTIVO_ENTRADA_COMPRA,
        cantidadVariacion: 5,
        stockResultante: 5,
        compraId: ID_COMPRA_CONTADO,
        auditoriaStockId: ID_AUDITORIA_COMPRA_1,
        nota: 'Compra C-00001',
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
      },
      {
        id: ID_MOV_STOCK_3,
        fecha: fechaCompra2,
        varianteId: ID_VARIANTE_JEAN_42_AZUL,
        nombreVariante: 'Jean clásico · 42 · Azul',
        motivoId: ID_MOTIVO_ENTRADA_COMPRA,
        cantidadVariacion: 20,
        stockResultante: 20,
        compraId: ID_COMPRA_CUENTA,
        auditoriaStockId: ID_AUDITORIA_COMPRA_2,
        nota: 'Compra C-00002',
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
      },
    ],
  });

  await prisma.movimientoCuentaCorrienteProveedor.create({
    data: {
      id: ID_MOV_CC_PROVEEDOR_CARGO,
      proveedorId: ID_PROVEEDOR_TEXTIL,
      fecha: fechaCompra2,
      tipoMovimiento: TipoMovimientoCuentaCorriente.cargo,
      importe: decimal(45000),
      descripcion: 'Compra C-00002',
      registradoPorUsuarioId: ID_USUARIO_ADMIN,
    },
  });
}

async function sembrarVentas(): Promise<void> {
  const fechaVenta1 = diasAtras(7);
  const fechaVenta2 = diasAtras(5);
  const fechaVenta3 = diasAtras(2);

  await prisma.venta.create({
    data: {
      id: ID_VENTA_EFECTIVO,
      numero: 'V-00001',
      fecha: fechaVenta1,
      clienteId: ID_CLIENTE_JUAN,
      nombreClienteMostrar: 'Juan Pérez',
      documentoClienteMostrar: '20-28444555-6',
      condicionIvaCliente: CondicionIvaCliente.CONSUMIDOR_FINAL,
      formaPago: FormaPagoVenta.EFECTIVO,
      total: decimal(10000),
      estadoFacturacionId: ID_ESTADO_FACTURACION_FACTURADA,
      facturacion: 'FA-000101',
      lineas: {
        create: [
          {
            id: ID_VENTA_LINEA_1,
            varianteId: ID_VARIANTE_REMERA_M_NEGRO,
            nombre: 'Remera básica algodón · M · Negro',
            cantidad: 2,
            precioUnitario: decimal(5000),
            subtotal: decimal(10000),
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      id: ID_VENTA_CUENTA,
      numero: 'V-00002',
      fecha: fechaVenta2,
      clienteId: ID_CLIENTE_MARIA,
      nombreClienteMostrar: 'María Gómez',
      documentoClienteMostrar: '27-30111222-3',
      condicionIvaCliente: CondicionIvaCliente.CONSUMIDOR_FINAL,
      formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
      total: decimal(15000),
      estadoFacturacionId: ID_ESTADO_FACTURACION_PENDIENTE,
      lineas: {
        create: [
          {
            id: ID_VENTA_LINEA_2,
            varianteId: ID_VARIANTE_REMERA_M_NEGRO,
            nombre: 'Remera básica algodón · M · Negro',
            cantidad: 3,
            precioUnitario: decimal(5000),
            subtotal: decimal(15000),
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      id: ID_VENTA_TRANSFERENCIA,
      numero: 'V-00003',
      fecha: fechaVenta3,
      clienteId: ID_CLIENTE_COMERCIO,
      nombreClienteMostrar: 'Comercio San Martín SRL',
      documentoClienteMostrar: '30-70999888-1',
      condicionIvaCliente: CondicionIvaCliente.RESPONSABLE_INSCRIPTO,
      formaPago: FormaPagoVenta.TRANSFERENCIA,
      total: decimal(24000),
      estadoFacturacionId: ID_ESTADO_FACTURACION_FACTURADA,
      facturacion: 'FA-000102',
      lineas: {
        create: [
          {
            id: ID_VENTA_LINEA_3,
            varianteId: ID_VARIANTE_JEAN_42_AZUL,
            nombre: 'Jean clásico · 42 · Azul',
            cantidad: 2,
            precioUnitario: decimal(12000),
            subtotal: decimal(24000),
          },
        ],
      },
    },
  });

  await prisma.auditoriaStock.createMany({
    data: [
      {
        id: ID_AUDITORIA_VENTA_1,
        tipo: TipoAuditoriaStock.venta,
        fecha: fechaVenta1,
        titulo: 'Venta V-00001',
        referencia: 'V-00001',
        ventaId: ID_VENTA_EFECTIVO,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
        variacionNeta: -2,
        cantidadMovimientos: 1,
      },
      {
        id: ID_AUDITORIA_VENTA_2,
        tipo: TipoAuditoriaStock.venta,
        fecha: fechaVenta2,
        titulo: 'Venta V-00002',
        referencia: 'V-00002',
        ventaId: ID_VENTA_CUENTA,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
        variacionNeta: -3,
        cantidadMovimientos: 1,
      },
      {
        id: ID_AUDITORIA_VENTA_3,
        tipo: TipoAuditoriaStock.venta,
        fecha: fechaVenta3,
        titulo: 'Venta V-00003',
        referencia: 'V-00003',
        ventaId: ID_VENTA_TRANSFERENCIA,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
        variacionNeta: -2,
        cantidadMovimientos: 1,
      },
    ],
  });

  await prisma.stockVariante.update({
    where: { varianteId: ID_VARIANTE_REMERA_M_NEGRO },
    data: { cantidadActual: 5 },
  });
  await prisma.stockVariante.update({
    where: { varianteId: ID_VARIANTE_JEAN_42_AZUL },
    data: { cantidadActual: 18 },
  });

  await prisma.movimientoStock.createMany({
    data: [
      {
        id: ID_MOV_STOCK_4,
        fecha: fechaVenta1,
        varianteId: ID_VARIANTE_REMERA_M_NEGRO,
        nombreVariante: 'Remera básica algodón · M · Negro',
        motivoId: ID_MOTIVO_SALIDA_VENTA,
        cantidadVariacion: -2,
        stockResultante: 8,
        ventaId: ID_VENTA_EFECTIVO,
        numeroVenta: 'V-00001',
        auditoriaStockId: ID_AUDITORIA_VENTA_1,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
      },
      {
        id: ID_MOV_STOCK_5,
        fecha: fechaVenta2,
        varianteId: ID_VARIANTE_REMERA_M_NEGRO,
        nombreVariante: 'Remera básica algodón · M · Negro',
        motivoId: ID_MOTIVO_SALIDA_VENTA,
        cantidadVariacion: -3,
        stockResultante: 5,
        ventaId: ID_VENTA_CUENTA,
        numeroVenta: 'V-00002',
        auditoriaStockId: ID_AUDITORIA_VENTA_2,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
      },
      {
        id: ID_MOV_STOCK_6,
        fecha: fechaVenta3,
        varianteId: ID_VARIANTE_JEAN_42_AZUL,
        nombreVariante: 'Jean clásico · 42 · Azul',
        motivoId: ID_MOTIVO_SALIDA_VENTA,
        cantidadVariacion: -2,
        stockResultante: 18,
        ventaId: ID_VENTA_TRANSFERENCIA,
        numeroVenta: 'V-00003',
        auditoriaStockId: ID_AUDITORIA_VENTA_3,
        ejecutadoPorUsuarioId: ID_USUARIO_ADMIN,
      },
    ],
  });

  await prisma.movimientoCuentaCorriente.create({
    data: {
      id: ID_MOV_CC_CLIENTE_CARGO,
      clienteId: ID_CLIENTE_MARIA,
      fecha: fechaVenta2,
      tipoMovimiento: TipoMovimientoCuentaCorriente.cargo,
      importe: decimal(15000),
      descripcion: 'Venta V-00002',
      registradoPorUsuarioId: ID_USUARIO_ADMIN,
    },
  });
}

async function sembrarPagosCuentaCorriente(): Promise<void> {
  const fechaPagoCliente = diasAtras(3);
  const fechaPagoProveedor = diasAtras(4);

  await prisma.movimientoCuentaCorriente.create({
    data: {
      id: ID_MOV_CC_CLIENTE_PAGO,
      clienteId: ID_CLIENTE_MARIA,
      fecha: fechaPagoCliente,
      tipoMovimiento: TipoMovimientoCuentaCorriente.pagoRegistrado,
      importe: decimal(8000),
      descripcion: 'Pago parcial mostrador',
      registradoPorUsuarioId: ID_USUARIO_ADMIN,
      auditoriaPagoJson: {
        marcaTiempoUtcRegistroCliente: fechaPagoCliente.toISOString(),
        codigoPublicoRecibo: 'REC-20260115-DEMO01',
        etiquetaUsuarioRegistrante: 'admin',
        idUsuarioSesionRegistrante: ID_USUARIO_ADMIN,
        canalCapturaDocumentado: 'interfaz_web_erp',
        formaDePagoEtiqueta: 'Transferencia',
        referenciaDelPagoOpcional: 'TRX-DEMO-001',
      },
    },
  });

  await prisma.movimientoCuentaCorrienteProveedor.create({
    data: {
      id: ID_MOV_CC_PROVEEDOR_PAGO,
      proveedorId: ID_PROVEEDOR_TEXTIL,
      fecha: fechaPagoProveedor,
      tipoMovimiento: TipoMovimientoCuentaCorriente.pagoRegistrado,
      importe: decimal(20000),
      descripcion: 'Pago parcial Textil Norte',
      registradoPorUsuarioId: ID_USUARIO_ADMIN,
      auditoriaPagoJson: {
        marcaTiempoUtcRegistroCliente: fechaPagoProveedor.toISOString(),
        codigoPublicoRecibo: 'REP-20260116-DEMO01',
        etiquetaUsuarioRegistrante: 'admin',
        idUsuarioSesionRegistrante: ID_USUARIO_ADMIN,
        canalCapturaDocumentado: 'interfaz_web_erp',
        formaDePagoEtiqueta: 'Transferencia',
        referenciaDelPagoOpcional: 'OP-7788',
      },
    },
  });
}

async function main(): Promise<void> {
  await sembrarMotivosStock(prisma);
  await sembrarEstadosFacturacion(prisma);
  await sembrarUsuarioAdministrador(prisma);

  await limpiarDatosDemo();
  await sembrarNegocioYConfiguracion();
  await sembrarCatalogoYStock();
  await sembrarClientesYProveedores();
  await sembrarCompras();
  await sembrarVentas();
  await sembrarPagosCuentaCorriente();

  // eslint-disable-next-line no-console
  console.log(
    [
      'Semilla demo aplicada.',
      'Clientes: María (CC saldo ~7000), Juan (sin CC), Comercio San Martín (CC sin movimientos).',
      'Proveedores: Textil Norte (CC saldo ~25000), Mayorista Rápido (solo contado).',
      'Compras: C-00001 contado, C-00002 cuenta proveedor.',
      'Ventas: V-00001 efectivo, V-00002 cuenta corriente, V-00003 transferencia.',
      'Login: admin / 12345678',
    ].join('\n'),
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Error en semilla demo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
