/** Categorías del panel de reportes (no aparecen en la barra lateral). */
export type CategoriaReporte =
  | 'operacion-diaria'
  | 'inventario'
  | 'clientes-cobranzas'
  | 'compras'
  | 'analisis-comercial'
  | 'facturacion';

export interface GrupoReportes {
  id: CategoriaReporte;
  titulo: string;
  descripcion: string;
}

export interface DefinicionReporte {
  id: string;
  titulo: string;
  descripcion: string;
  nombreRuta: string;
  categoria: CategoriaReporte;
  disponible: boolean;
  ordenEnGrupo: number;
}

export const gruposReportes: GrupoReportes[] = [
  {
    id: 'operacion-diaria',
    titulo: 'Operación diaria',
    descripcion: 'Cierre de ventas y alertas del día a día en mostrador.',
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    descripcion: 'Existencias, valorización y movimientos de mercadería.',
  },
  {
    id: 'clientes-cobranzas',
    titulo: 'Clientes y cobranzas',
    descripcion: 'Saldos, límites y movimientos de cuenta corriente.',
  },
  {
    id: 'compras',
    titulo: 'Compras',
    descripcion: 'Análisis de ingresos de mercadería y proveedores.',
  },
  {
    id: 'analisis-comercial',
    titulo: 'Análisis comercial',
    descripcion: 'Rankings y desglose por rubros para decisiones de surtido.',
  },
  {
    id: 'facturacion',
    titulo: 'Facturación',
    descripcion: 'Exportaciones para emitir comprobantes fiscales de las ventas.',
  },
];

export const catalogoReportes: DefinicionReporte[] = [
  {
    id: 'ventas-periodo',
    titulo: 'Ventas por período',
    descripcion: 'Totales, operaciones y desglose por forma de pago.',
    nombreRuta: 'reportes-ventas-periodo',
    categoria: 'operacion-diaria',
    disponible: true,
    ordenEnGrupo: 1,
  },
  {
    id: 'stock-critico',
    titulo: 'Stock crítico',
    descripcion: 'Artículos con poco stock o agotados.',
    nombreRuta: 'reportes-stock-critico',
    categoria: 'operacion-diaria',
    disponible: true,
    ordenEnGrupo: 2,
  },
  {
    id: 'stock-valorizado',
    titulo: 'Stock valorizado',
    descripcion: 'Existencias actuales y valor estimado a precio de venta.',
    nombreRuta: 'reportes-stock-valorizado',
    categoria: 'inventario',
    disponible: true,
    ordenEnGrupo: 1,
  },
  {
    id: 'movimientos-stock',
    titulo: 'Movimientos de stock',
    descripcion: 'Entradas, salidas y ajustes por ventas, compras y conteos.',
    nombreRuta: 'reportes-movimientos-stock',
    categoria: 'inventario',
    disponible: true,
    ordenEnGrupo: 2,
  },
  {
    id: 'cuentas-corrientes',
    titulo: 'Cuentas corrientes',
    descripcion: 'Saldos, movimientos del período y límites por cliente.',
    nombreRuta: 'reportes-cuentas-corrientes',
    categoria: 'clientes-cobranzas',
    disponible: true,
    ordenEnGrupo: 1,
  },
  {
    id: 'compras-proveedor',
    titulo: 'Compras por proveedor',
    descripcion: 'Totales por proveedor y condición de pago.',
    nombreRuta: 'reportes-compras-proveedor',
    categoria: 'compras',
    disponible: true,
    ordenEnGrupo: 1,
  },
  {
    id: 'productos-mas-vendidos',
    titulo: 'Productos más vendidos',
    descripcion: 'Ranking por unidades e importe en el período.',
    nombreRuta: 'reportes-productos-mas-vendidos',
    categoria: 'analisis-comercial',
    disponible: true,
    ordenEnGrupo: 1,
  },
  {
    id: 'ventas-por-categoria',
    titulo: 'Ventas por categoría',
    descripcion: 'Facturación agrupada por rubro del catálogo.',
    nombreRuta: 'reportes-ventas-por-categoria',
    categoria: 'analisis-comercial',
    disponible: true,
    ordenEnGrupo: 2,
  },
  {
    id: 'ventas-facturacion',
    titulo: 'Ventas para facturación',
    descripcion: 'Excel con datos fiscales de cada venta para emitir comprobantes.',
    nombreRuta: 'reportes-ventas-facturacion',
    categoria: 'facturacion',
    disponible: true,
    ordenEnGrupo: 1,
  },
];

/** Rutas hijas de reportes (activan «Reportes» en el menú sin listarlas en la barra). */
export const rutasHijasReportes = catalogoReportes.map((r) => r.nombreRuta);

export interface GrupoReportesConItems extends GrupoReportes {
  reportes: DefinicionReporte[];
}

export function obtenerGruposReportesPanel(): GrupoReportesConItems[] {
  return gruposReportes
    .map((grupo) => ({
      ...grupo,
      reportes: catalogoReportes
        .filter((r) => r.categoria === grupo.id)
        .sort((a, b) => a.ordenEnGrupo - b.ordenEnGrupo),
    }))
    .filter((grupo) => grupo.reportes.length > 0);
}
