import type { VentaRegistrada } from '../tipos/venta';

function iso(diasAtras: number, horaH = 14, horaM = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(horaH, horaM, 0, 0);
  return d.toISOString();
}

/**
 * Ventas de ejemplo para ver el listado (filtros, totales, condiciones).
 * Los números V-00001 … V-00008 son fijos; nuevas ventas siguen con V-00009, etc.
 */
export function crearSemillaVentas(): VentaRegistrada[] {
  return [
    {
      id: 'vta-semilla-0008',
      numero: 'V-00008',
      fecha: iso(0, 11, 12),
      clienteId: null,
      nombreClienteMostrar: 'Consumidor final',
      formaPago: 'EFECTIVO',
      total: 185_000,
      observaciones: '',
      lineas: [
        {
          productoId: 'p-d1',
          nombre: 'Campera impermeable',
          cantidad: 1,
          precioUnitario: 185_000,
          subtotal: 185_000,
        },
      ],
    },
    {
      id: 'vta-semilla-0007',
      numero: 'V-00007',
      fecha: iso(0, 9, 5),
      clienteId: 'cli00001-0000-4000-8000-000000000002',
      nombreClienteMostrar: 'Lucía Fernández',
      formaPago: 'DEBITO',
      total: 42_500,
      observaciones: 'Retira por local',
      lineas: [
        {
          productoId: 'p-d2',
          nombre: 'Bufanda tejida',
          cantidad: 1,
          precioUnitario: 12_500,
          subtotal: 12_500,
        },
        {
          productoId: 'p-d3',
          nombre: 'Gorra bordó',
          cantidad: 2,
          precioUnitario: 15_000,
          subtotal: 30_000,
        },
      ],
    },
    {
      id: 'vta-semilla-0006',
      numero: 'V-00006',
      fecha: iso(1, 16, 45),
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      nombreClienteMostrar: 'María García',
      formaPago: 'CUENTA_CORRIENTE',
      total: 312_000,
      observaciones: '',
      lineas: [
        {
          productoId: 'p-d4',
          nombre: 'Vestido largo estampado',
          cantidad: 1,
          precioUnitario: 198_000,
          subtotal: 198_000,
        },
        {
          productoId: 'p-d5',
          nombre: 'Cinturón cuero',
          cantidad: 2,
          precioUnitario: 57_000,
          subtotal: 114_000,
        },
      ],
    },
    {
      id: 'vta-semilla-0005',
      numero: 'V-00005',
      fecha: iso(2, 12, 0),
      clienteId: null,
      nombreClienteMostrar: 'Consumidor final',
      formaPago: 'TRANSFERENCIA',
      total: 67_800,
      observaciones: 'Transferencia acreditada',
      lineas: [
        {
          productoId: 'p-d6',
          nombre: 'Jean clásico talle 42',
          cantidad: 1,
          precioUnitario: 67_800,
          subtotal: 67_800,
        },
      ],
    },
    {
      id: 'vta-semilla-0004',
      numero: 'V-00004',
      fecha: iso(3, 18, 20),
      clienteId: 'cli00001-0000-4000-8000-000000000003',
      nombreClienteMostrar: 'Ana Boutique (mayorista)',
      formaPago: 'CREDITO',
      total: 890_000,
      observaciones: 'Orden mayorista · 3 cuotas sin interés',
      lineas: [
        {
          productoId: 'p-d7',
          nombre: 'Pack remeras x12 surtido',
          cantidad: 2,
          precioUnitario: 400_000,
          subtotal: 800_000,
        },
        {
          productoId: 'p-d8',
          nombre: 'Short deportivo',
          cantidad: 3,
          precioUnitario: 30_000,
          subtotal: 90_000,
        },
      ],
    },
    {
      id: 'vta-semilla-0003',
      numero: 'V-00003',
      fecha: iso(5, 10, 15),
      clienteId: null,
      nombreClienteMostrar: 'Consumidor final',
      formaPago: 'EFECTIVO',
      total: 24_000,
      observaciones: '',
      lineas: [
        {
          productoId: 'p-d9',
          nombre: 'Medias pack x3',
          cantidad: 4,
          precioUnitario: 6_000,
          subtotal: 24_000,
        },
      ],
    },
    {
      id: 'vta-semilla-0002',
      numero: 'V-00002',
      fecha: iso(8, 15, 40),
      clienteId: 'cli00001-0000-4000-8000-000000000002',
      nombreClienteMostrar: 'Lucía Fernández',
      formaPago: 'DEBITO',
      total: 156_400,
      observaciones: '',
      lineas: [
        {
          productoId: 'p-d10',
          nombre: 'Sweater cuello V',
          cantidad: 1,
          precioUnitario: 89_400,
          subtotal: 89_400,
        },
        {
          productoId: 'p-d11',
          nombre: 'Pantalón gabardina',
          cantidad: 1,
          precioUnitario: 67_000,
          subtotal: 67_000,
        },
      ],
    },
    {
      id: 'vta-semilla-0001',
      numero: 'V-00001',
      fecha: iso(12, 11, 0),
      clienteId: 'cli00001-0000-4000-8000-000000000001',
      nombreClienteMostrar: 'María García',
      formaPago: 'EFECTIVO',
      total: 45_500,
      observaciones: 'Primera compra del mes',
      lineas: [
        {
          productoId: 'p-d12',
          nombre: 'Remera manga larga',
          cantidad: 2,
          precioUnitario: 22_750,
          subtotal: 45_500,
        },
      ],
    },
  ];
}
