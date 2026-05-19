import type { CompraRegistrada } from '../tipos/compraRegistrada';

function iso(diasAtras: number, horaH = 10, horaM = 15): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(horaH, horaM, 0, 0);
  return d.toISOString();
}

/** Compras de ejemplo para el registro local (numeración C-00001 …). */
export function crearSemillaComprasRegistro(): CompraRegistrada[] {
  return [
    {
      id: 'cmp-semilla-0003',
      numero: 'C-00003',
      fecha: iso(0, 11, 20),
      proveedorId: 'prv-sem-000001',
      nombreProveedorMostrar: 'Textiles del Sur SA',
      condicionCompra: 'CUENTA_PROVEEDOR',
      total: 892_400,
      observaciones: 'Ingresan en depósito central.',
      lineas: [
        {
          productoId: 'p-demo-ropa-1',
          nombre: 'Tela gabardina negra rollo',
          cantidad: 8,
          costoUnitario: 68_050,
          subtotal: 544_400,
        },
        {
          productoId: 'p-demo-ropa-2',
          nombre: 'Hilo poliéster 40/2 bobina',
          cantidad: 120,
          costoUnitario: 2900,
          subtotal: 348_000,
        },
      ],
    },
    {
      id: 'cmp-semilla-0002',
      numero: 'C-00002',
      fecha: iso(3, 9, 0),
      proveedorId: 'prv-sem-000002',
      nombreProveedorMostrar: 'Importadora Rivera',
      condicionCompra: 'CONTADO',
      total: 215_000,
      observaciones: '',
      lineas: [
        {
          productoId: null,
          nombre: 'Caja surtido accesorios temporada',
          cantidad: 5,
          costoUnitario: 43_000,
          subtotal: 215_000,
        },
      ],
    },
    {
      id: 'cmp-semilla-0001',
      numero: 'C-00001',
      fecha: iso(11, 15, 40),
      proveedorId: 'prv-sem-000003',
      nombreProveedorMostrar: 'Calzados Patagonia',
      condicionCompra: 'CONTADO',
      total: 1_068_750,
      observaciones: 'Remito R-8921.',
      lineas: [
        {
          productoId: 'p-demo-calz-1',
          nombre: 'Zapatillas running talle surtido',
          cantidad: 45,
          costoUnitario: 21_750,
          subtotal: 978_750,
        },
        {
          productoId: null,
          nombre: 'Plantillas térmicas par',
          cantidad: 60,
          costoUnitario: 1500,
          subtotal: 90_000,
        },
      ],
    },
  ];
}
