import plantillaCambioConteo from './plantillas/cambio-conteo.eta?raw';
import plantillaComprasProveedor from './plantillas/compras-proveedor.eta?raw';
import plantillaCuentasCorrientes from './plantillas/cuentas-corrientes.eta?raw';
import plantillaCuentasCorrientesProveedor from './plantillas/cuentas-corrientes-proveedor.eta?raw';
import plantillaMovimientosStock from './plantillas/movimientos-stock.eta?raw';
import plantillaProductosMasVendidos from './plantillas/productos-mas-vendidos.eta?raw';
import plantillaStockCritico from './plantillas/stock-critico.eta?raw';
import plantillaStockValorizado from './plantillas/stock-valorizado.eta?raw';
import plantillaVentasPeriodo from './plantillas/ventas-periodo.eta?raw';
import plantillaVentasPorCategoria from './plantillas/ventas-por-categoria.eta?raw';

export const plantillasReportes = {
  'ventas-periodo': plantillaVentasPeriodo,
  'stock-critico': plantillaStockCritico,
  'stock-valorizado': plantillaStockValorizado,
  'movimientos-stock': plantillaMovimientosStock,
  'cuentas-corrientes': plantillaCuentasCorrientes,
  'cuentas-corrientes-proveedor': plantillaCuentasCorrientesProveedor,
  'compras-proveedor': plantillaComprasProveedor,
  'productos-mas-vendidos': plantillaProductosMasVendidos,
  'ventas-por-categoria': plantillaVentasPorCategoria,
  'cambio-conteo': plantillaCambioConteo,
} as const;

export type IdPlantillaReporte = keyof typeof plantillasReportes;
