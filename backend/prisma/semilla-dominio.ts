import { Prisma, PrismaClient, CondicionIvaCliente } from '@prisma/client';
import {
  CANTIDAD_STOCK_INICIAL,
  ID_CATEGORIA_ACCESORIOS,
  ID_CATEGORIA_BUZO,
  ID_CATEGORIA_CALZADO,
  ID_CATEGORIA_CAMPERA,
  ID_CATEGORIA_DEPORTIVO,
  ID_CATEGORIA_INFANTIL,
  ID_CATEGORIA_PANTALON,
  ID_CATEGORIA_REMERA,
  ID_PRODUCTO_BUZO,
  ID_PRODUCTO_CAMPERA,
  ID_PRODUCTO_GORRA,
  ID_PRODUCTO_JEAN,
  ID_PRODUCTO_PANTALON,
  ID_PRODUCTO_REMERA,
  ID_PRODUCTO_REMERA_NINO,
  ID_PRODUCTO_REMERA_OVERSIZE,
  ID_PRODUCTO_SHORT,
  ID_PRODUCTO_ZAPATILLA,
  ID_VARIANTE_BUZO_L_GRIS,
  ID_VARIANTE_BUZO_M_GRIS,
  ID_VARIANTE_CAMPERA_M_NEGRO,
  ID_VARIANTE_GORRA_UNICA_NEGRO,
  ID_VARIANTE_JEAN_38_AZUL,
  ID_VARIANTE_JEAN_40_AZUL,
  ID_VARIANTE_PANTALON_40_AZUL,
  ID_VARIANTE_PANTALON_42_AZUL,
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

export async function sembrarCatalogoYStock(prisma: PrismaClient): Promise<void> {
  const categorias = [
    { id: ID_CATEGORIA_REMERA, nombre: 'Remera', descripcion: 'Prendas superiores livianas' },
    { id: ID_CATEGORIA_PANTALON, nombre: 'Pantalón', descripcion: 'Prendas inferiores' },
    { id: ID_CATEGORIA_BUZO, nombre: 'Buzo', descripcion: 'Abrigo liviano y frisa' },
    { id: ID_CATEGORIA_CALZADO, nombre: 'Calzado', descripcion: 'Zapatillas y calzado urbano' },
    { id: ID_CATEGORIA_ACCESORIOS, nombre: 'Accesorios', descripcion: 'Gorras y complementos' },
    { id: ID_CATEGORIA_CAMPERA, nombre: 'Campera', descripcion: 'Camperas y abrigos' },
    { id: ID_CATEGORIA_DEPORTIVO, nombre: 'Deportivo', descripcion: 'Indumentaria deportiva' },
    { id: ID_CATEGORIA_INFANTIL, nombre: 'Infantil', descripcion: 'Talles para niños' },
  ];

  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { id: c.id },
      create: c,
      update: { nombre: c.nombre, descripcion: c.descripcion },
    });
  }

  const productos = [
    {
      id: ID_PRODUCTO_REMERA,
      nombre: 'Remera modal básica',
      marca: 'Línea tienda',
      descripcion: 'Algodón modal, corte regular',
      categoriaId: ID_CATEGORIA_REMERA,
      precioVenta: new Prisma.Decimal(15900),
    },
    {
      id: ID_PRODUCTO_PANTALON,
      nombre: 'Pantalón mom fit',
      marca: 'Línea tienda',
      descripcion: 'Denim elastizado, tiro alto',
      categoriaId: ID_CATEGORIA_PANTALON,
      precioVenta: new Prisma.Decimal(28900),
    },
    {
      id: ID_PRODUCTO_BUZO,
      nombre: 'Buzo frisa liso',
      marca: 'Línea tienda',
      descripcion: 'Frisa peinada, cuello redondo',
      categoriaId: ID_CATEGORIA_BUZO,
      precioVenta: new Prisma.Decimal(24900),
    },
    {
      id: ID_PRODUCTO_ZAPATILLA,
      nombre: 'Zapatilla urbana clásica',
      marca: 'Walk & Co',
      descripcion: 'Suela EVA, capellada sintética',
      categoriaId: ID_CATEGORIA_CALZADO,
      precioVenta: new Prisma.Decimal(45900),
    },
    {
      id: ID_PRODUCTO_CAMPERA,
      nombre: 'Campera softshell',
      marca: 'Outdoor Norte',
      descripcion: 'Rompeviento impermeable, capucha',
      categoriaId: ID_CATEGORIA_CAMPERA,
      precioVenta: new Prisma.Decimal(52900),
    },
    {
      id: ID_PRODUCTO_GORRA,
      nombre: 'Gorra clásica ajustable',
      marca: 'Línea tienda',
      descripcion: 'Visera curva, broche metálico',
      categoriaId: ID_CATEGORIA_ACCESORIOS,
      precioVenta: new Prisma.Decimal(8900),
    },
    {
      id: ID_PRODUCTO_REMERA_OVERSIZE,
      nombre: 'Remera oversize algodón',
      marca: 'Urban Fit',
      descripcion: 'Algodón peinado, corte holgado',
      categoriaId: ID_CATEGORIA_REMERA,
      precioVenta: new Prisma.Decimal(18900),
    },
    {
      id: ID_PRODUCTO_SHORT,
      nombre: 'Short running dry-fit',
      marca: 'Active Pro',
      descripcion: 'Tela respirable con bolsillos',
      categoriaId: ID_CATEGORIA_DEPORTIVO,
      precioVenta: new Prisma.Decimal(16900),
    },
    {
      id: ID_PRODUCTO_JEAN,
      nombre: 'Jean slim fit',
      marca: 'Denim House',
      descripcion: 'Denim 98% algodón, lavado medio',
      categoriaId: ID_CATEGORIA_PANTALON,
      precioVenta: new Prisma.Decimal(31900),
    },
    {
      id: ID_PRODUCTO_REMERA_NINO,
      nombre: 'Remera niño estampada',
      marca: 'Kids Line',
      descripcion: 'Estampado divertido, algodón suave',
      categoriaId: ID_CATEGORIA_INFANTIL,
      precioVenta: new Prisma.Decimal(12900),
    },
  ];

  for (const p of productos) {
    await prisma.producto.upsert({
      where: { id: p.id },
      create: { ...p, fechaEliminacion: null },
      update: { ...p, fechaEliminacion: null },
    });
  }

  const variantes = [
    {
      id: ID_VARIANTE_REMERA_S_NEGRO,
      productoId: ID_PRODUCTO_REMERA,
      talle: 'S',
      color: 'Negro',
      codigoBarras: '7791234567891',
    },
    {
      id: ID_VARIANTE_REMERA_M_NEGRO,
      productoId: ID_PRODUCTO_REMERA,
      talle: 'M',
      color: 'Negro',
      codigoBarras: '7791234567892',
    },
    {
      id: ID_VARIANTE_REMERA_L_NEGRO,
      productoId: ID_PRODUCTO_REMERA,
      talle: 'L',
      color: 'Negro',
      codigoBarras: '7791234567893',
    },
    {
      id: ID_VARIANTE_REMERA_M_ROJO,
      productoId: ID_PRODUCTO_REMERA,
      talle: 'M',
      color: 'Rojo',
      codigoBarras: '7791234567894',
    },
    {
      id: ID_VARIANTE_REMERA_S_BLANCO,
      productoId: ID_PRODUCTO_REMERA,
      talle: 'S',
      color: 'Blanco',
      codigoBarras: '7791234567895',
    },
    {
      id: ID_VARIANTE_PANTALON_40_AZUL,
      productoId: ID_PRODUCTO_PANTALON,
      talle: '40',
      color: 'Azul',
      codigoBarras: '7799876543211',
    },
    {
      id: ID_VARIANTE_PANTALON_42_AZUL,
      productoId: ID_PRODUCTO_PANTALON,
      talle: '42',
      color: 'Azul',
      codigoBarras: '7799876543212',
    },
    {
      id: ID_VARIANTE_BUZO_M_GRIS,
      productoId: ID_PRODUCTO_BUZO,
      talle: 'M',
      color: 'Gris',
      codigoBarras: '7795555555555',
    },
    {
      id: ID_VARIANTE_BUZO_L_GRIS,
      productoId: ID_PRODUCTO_BUZO,
      talle: 'L',
      color: 'Gris',
      codigoBarras: '7795555555556',
    },
    {
      id: ID_VARIANTE_ZAPATILLA_40_NEGRO,
      productoId: ID_PRODUCTO_ZAPATILLA,
      talle: '40',
      color: 'Negro',
      codigoBarras: '7794444444401',
    },
    {
      id: ID_VARIANTE_ZAPATILLA_41_NEGRO,
      productoId: ID_PRODUCTO_ZAPATILLA,
      talle: '41',
      color: 'Negro',
      codigoBarras: '7794444444402',
    },
    {
      id: ID_VARIANTE_CAMPERA_M_NEGRO,
      productoId: ID_PRODUCTO_CAMPERA,
      talle: 'M',
      color: 'Negro',
      codigoBarras: '7793333333301',
    },
    {
      id: ID_VARIANTE_GORRA_UNICA_NEGRO,
      productoId: ID_PRODUCTO_GORRA,
      talle: 'Único',
      color: 'Negro',
      codigoBarras: '7792222222201',
    },
    {
      id: ID_VARIANTE_REMERA_OVERSIZE_L_BLANCO,
      productoId: ID_PRODUCTO_REMERA_OVERSIZE,
      talle: 'L',
      color: 'Blanco',
      codigoBarras: '7791111111101',
    },
    {
      id: ID_VARIANTE_SHORT_M_AZUL,
      productoId: ID_PRODUCTO_SHORT,
      talle: 'M',
      color: 'Azul',
      codigoBarras: '7790000000001',
    },
    {
      id: ID_VARIANTE_JEAN_38_AZUL,
      productoId: ID_PRODUCTO_JEAN,
      talle: '38',
      color: 'Azul',
      codigoBarras: '7789999999901',
    },
    {
      id: ID_VARIANTE_JEAN_40_AZUL,
      productoId: ID_PRODUCTO_JEAN,
      talle: '40',
      color: 'Azul',
      codigoBarras: '7789999999902',
    },
    {
      id: ID_VARIANTE_REMERA_NINO_10_AZUL,
      productoId: ID_PRODUCTO_REMERA_NINO,
      talle: '10',
      color: 'Azul',
      codigoBarras: '7788888888801',
    },
  ];

  for (const v of variantes) {
    await prisma.variante.upsert({
      where: { id: v.id },
      create: { ...v, activa: true },
      update: { ...v, activa: true },
    });
    await prisma.stockVariante.upsert({
      where: { varianteId: v.id },
      create: { varianteId: v.id, cantidadActual: CANTIDAD_STOCK_INICIAL[v.id] ?? 0 },
      update: { cantidadActual: CANTIDAD_STOCK_INICIAL[v.id] ?? 0 },
    });
  }
}

interface ClienteSemilla {
  id: string;
  nombre: string;
  documento: string;
  condicionIva: CondicionIvaCliente;
  correoElectronico: string;
  telefonoPrincipal: string;
  telefonoAlternativo: string;
  direccion: string;
  limiteCompraCuentaCorriente: number;
  cuentaCorrienteHabilitada: boolean;
  habilitado: boolean;
}

const clientesSemilla: ClienteSemilla[] = [
  {
    id: '000001',
    nombre: 'María García',
    documento: '27.123.456',
    condicionIva: CondicionIvaCliente.CONSUMIDOR_FINAL,
    correoElectronico: 'cliente.001@facturacion.demostracion.ar',
    telefonoPrincipal: '+54 11 4000-2200',
    telefonoAlternativo: '+54 9 11 6000-1100',
    direccion: 'Av. Corrientes 2100, CABA',
    limiteCompraCuentaCorriente: 500_000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
  },
  {
    id: '000002',
    nombre: 'Lucía Fernández',
    documento: '38.765.432',
    condicionIva: CondicionIvaCliente.CONSUMIDOR_FINAL,
    correoElectronico: 'cliente.002@facturacion.demostracion.ar',
    telefonoPrincipal: '+54 11 5000-8899',
    telefonoAlternativo: '',
    direccion: 'Güemes 1450, Rosario',
    limiteCompraCuentaCorriente: 0,
    cuentaCorrienteHabilitada: false,
    habilitado: true,
  },
  {
    id: '000003',
    nombre: 'Ana Boutique (mayorista)',
    documento: '30-70845918-8',
    condicionIva: CondicionIvaCliente.RESPONSABLE_INSCRIPTO,
    correoElectronico: 'cliente.003@facturacion.demostracion.ar',
    telefonoPrincipal: '+54 341 412-3344',
    telefonoAlternativo: '',
    direccion: 'Bv. Oratorio 5200, Córdoba',
    limiteCompraCuentaCorriente: 2_500_000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
  },
  {
    id: '000004',
    nombre: 'Construcciones San José SA',
    documento: '30-71234567-9',
    condicionIva: CondicionIvaCliente.RESPONSABLE_INSCRIPTO,
    correoElectronico: 'compras@sanjose.demostracion.ar',
    telefonoPrincipal: '+54 11 4777-2200',
    telefonoAlternativo: '',
    direccion: 'Panamericana km 42',
    limiteCompraCuentaCorriente: 1_200_000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
  },
  {
    id: '000005',
    nombre: 'Distribuidora Andina (cuenta suspendida)',
    documento: '30-70998877-1',
    condicionIva: CondicionIvaCliente.MONOTRIBUTO,
    correoElectronico: '',
    telefonoPrincipal: '+54 381 444-9900',
    telefonoAlternativo: '',
    direccion: 'San Martín 800, Tucumán',
    limiteCompraCuentaCorriente: 800_000,
    cuentaCorrienteHabilitada: true,
    habilitado: false,
  },
];

export { clientesSemilla };

export async function sembrarClientes(prisma: PrismaClient): Promise<void> {
  for (const c of clientesSemilla) {
    await prisma.cliente.upsert({
      where: { id: c.id },
      create: {
        ...c,
        limiteCompraCuentaCorriente: new Prisma.Decimal(c.limiteCompraCuentaCorriente),
      },
      update: {
        ...c,
        limiteCompraCuentaCorriente: new Prisma.Decimal(c.limiteCompraCuentaCorriente),
        fechaEliminacion: null,
      },
    });
  }
}

const proveedoresSemilla = [
  {
    id: '000001',
    nombre: 'Textiles del Sur SA',
    documento: '30-71655448-9',
    correoElectronico: 'comercial@textilesdelsur.demostracion.ar',
    telefonoPrincipal: '+54 11 4788-1100',
    telefonoAlternativo: '+54 9 11 6200-4400',
    direccion: 'Av. Warnes 970, Buenos Aires',
    limiteCreditoCompras: 3_200_000,
    comprasCreditoHabilitadas: true,
    habilitado: true,
  },
  {
    id: '000002',
    nombre: 'Importadora Rivera',
    documento: '30-65987104-8',
    correoElectronico: 'facturacion@importadorarivera.demostracion.ar',
    telefonoPrincipal: '+54 341 422-8899',
    telefonoAlternativo: '',
    direccion: 'Zona industrial Rosario',
    limiteCreditoCompras: 0,
    comprasCreditoHabilitadas: false,
    habilitado: true,
  },
  {
    id: '000003',
    nombre: 'Calzados Patagonia',
    documento: '27-38902111-9',
    correoElectronico: '',
    telefonoPrincipal: '+54 2944 62-7711',
    telefonoAlternativo: '',
    direccion: 'Sarmiento 450, Neuquén',
    limiteCreditoCompras: 650_000,
    comprasCreditoHabilitadas: true,
    habilitado: true,
  },
];

export async function sembrarProveedores(prisma: PrismaClient): Promise<void> {
  for (const p of proveedoresSemilla) {
    await prisma.proveedor.upsert({
      where: { id: p.id },
      create: {
        ...p,
        limiteCreditoCompras: new Prisma.Decimal(p.limiteCreditoCompras),
      },
      update: {
        ...p,
        limiteCreditoCompras: new Prisma.Decimal(p.limiteCreditoCompras),
        fechaEliminacion: null,
      },
    });
  }
}
