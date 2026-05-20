/** Definición de un reporte disponible en el panel. */
export interface DefinicionReporte {
  id: string;
  titulo: string;
  descripcion: string;
  nombreRuta: string;
  disponible: boolean;
}

export const catalogoReportes: DefinicionReporte[] = [
  {
    id: 'ventas-periodo',
    titulo: 'Ventas por período',
    descripcion: 'Totales, cantidad de operaciones y desglose por forma de pago en un rango de fechas.',
    nombreRuta: 'reportes-ventas-periodo',
    disponible: true,
  },
  {
    id: 'stock-valorizado',
    titulo: 'Stock valorizado',
    descripcion: 'Existencias actuales con precio de venta y valor estimado del inventario.',
    nombreRuta: 'reportes-stock-valorizado',
    disponible: true,
  },
  {
    id: 'cuentas-corrientes',
    titulo: 'Cuentas corrientes',
    descripcion: 'Saldos por cliente, movimientos del período y límites de crédito.',
    nombreRuta: 'reportes-cuentas-corrientes',
    disponible: true,
  },
  {
    id: 'compras-proveedor',
    titulo: 'Compras por proveedor',
    descripcion: 'Compras registradas agrupadas por proveedor y condición de pago.',
    nombreRuta: 'reportes-compras-proveedor',
    disponible: true,
  },
];
