import plantillaComprasProveedor from './plantillas/compras-proveedor.eta?raw';
import plantillaCuentasCorrientes from './plantillas/cuentas-corrientes.eta?raw';
import plantillaStockValorizado from './plantillas/stock-valorizado.eta?raw';
import plantillaVentasPeriodo from './plantillas/ventas-periodo.eta?raw';

export const plantillasReportes = {
  'ventas-periodo': plantillaVentasPeriodo,
  'stock-valorizado': plantillaStockValorizado,
  'cuentas-corrientes': plantillaCuentasCorrientes,
  'compras-proveedor': plantillaComprasProveedor,
} as const;

export type IdPlantillaReporte = keyof typeof plantillasReportes;
