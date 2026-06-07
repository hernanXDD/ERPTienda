import plantillaResumenVenta from './plantillas/resumen-venta.eta?raw';

export const plantillasVentas = {
  'resumen-venta': plantillaResumenVenta,
} as const;

export type IdPlantillaVenta = keyof typeof plantillasVentas;
