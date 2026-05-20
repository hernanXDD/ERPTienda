import { Prisma, PrismaClient } from '@prisma/client';
import {
  CANTIDAD_STOCK_INICIAL,
  ID_CATEGORIA_BUZO,
  ID_CATEGORIA_CALZADO,
  ID_CATEGORIA_PANTALON,
  ID_CATEGORIA_REMERA,
  ID_PRODUCTO_BUZO,
  ID_PRODUCTO_PANTALON,
  ID_PRODUCTO_REMERA,
  ID_VARIANTE_BUZO_M_GRIS,
  ID_VARIANTE_PANTALON_40_AZUL,
  ID_VARIANTE_PANTALON_42_AZUL,
  ID_VARIANTE_REMERA_L_NEGRO,
  ID_VARIANTE_REMERA_M_NEGRO,
  ID_VARIANTE_REMERA_M_ROJO,
  ID_VARIANTE_REMERA_S_NEGRO,
} from './datos/semilla-catalogo';

export async function sembrarCatalogoYStock(prisma: PrismaClient): Promise<void> {
  const categorias = [
    { id: ID_CATEGORIA_REMERA, nombre: 'Remera', descripcion: 'Prenda superior' },
    { id: ID_CATEGORIA_PANTALON, nombre: 'Pantalón', descripcion: 'Prenda inferior' },
    { id: ID_CATEGORIA_BUZO, nombre: 'Buzo', descripcion: 'Abrigo liviano' },
    { id: ID_CATEGORIA_CALZADO, nombre: 'Calzado', descripcion: 'Calzado y zapatillas' },
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
      descripcion: 'Denim elastizado',
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
    id: 'cli00001-0000-4000-8000-000000000001',
    nombre: 'María García',
    documento: '27.123.456',
    correoElectronico: 'cliente.001@facturacion.demostracion.ar',
    telefonoPrincipal: '+54 11 4000-2200',
    telefonoAlternativo: '+54 9 11 6000-1100',
    direccion: 'Av. Corrientes 2100, CABA',
    limiteCompraCuentaCorriente: 500_000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
  },
  {
    id: 'cli00001-0000-4000-8000-000000000002',
    nombre: 'Lucía Fernández',
    documento: '38.765.432',
    correoElectronico: 'cliente.002@facturacion.demostracion.ar',
    telefonoPrincipal: '+54 11 5000-8899',
    telefonoAlternativo: '',
    direccion: 'Güemes 1450, Rosario',
    limiteCompraCuentaCorriente: 0,
    cuentaCorrienteHabilitada: false,
    habilitado: true,
  },
  {
    id: 'cli00001-0000-4000-8000-000000000003',
    nombre: 'Ana Boutique (mayorista)',
    documento: '30-70845918-8',
    correoElectronico: 'cliente.003@facturacion.demostracion.ar',
    telefonoPrincipal: '+54 341 412-3344',
    telefonoAlternativo: '',
    direccion: 'Bv. Oratorio 5200, Córdoba',
    limiteCompraCuentaCorriente: 2_500_000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
  },
  {
    id: 'cli00001-0000-4000-8000-000000000004',
    nombre: 'Construcciones San José SA',
    documento: '30-71234567-9',
    correoElectronico: 'compras@sanjose.demostracion.ar',
    telefonoPrincipal: '+54 11 4777-2200',
    telefonoAlternativo: '',
    direccion: 'Panamericana km 42',
    limiteCompraCuentaCorriente: 1_200_000,
    cuentaCorrienteHabilitada: true,
    habilitado: true,
  },
  {
    id: 'cli00001-0000-4000-8000-000000000005',
    nombre: 'Distribuidora Andina (cuenta suspendida)',
    documento: '30-70998877-1',
    correoElectronico: '',
    telefonoPrincipal: '+54 381 444-9900',
    telefonoAlternativo: '',
    direccion: 'San Martín 800, Tucumán',
    limiteCompraCuentaCorriente: 800_000,
    cuentaCorrienteHabilitada: true,
    habilitado: false,
  },
];

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
    id: 'a0000001-0000-4000-8000-000000000001',
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
    id: 'a0000001-0000-4000-8000-000000000002',
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
    id: 'a0000001-0000-4000-8000-000000000003',
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
