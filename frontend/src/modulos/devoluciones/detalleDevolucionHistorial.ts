import type { CuponDescuentoRegistrado } from '../../tipos/cuponDescuento';
import type { DevolucionRegistrada } from '../../tipos/devolucion';
import type { VentaRegistrada } from '../../tipos/venta';

export const PREFIJO_OBS_CAMBIO_POR_DEVOLUCION = 'Cambio por devolución';

export function ventaCambioPorDevolucion(
  devolucion: DevolucionRegistrada,
  ventas: VentaRegistrada[],
): VentaRegistrada | null {
  const marca = `${PREFIJO_OBS_CAMBIO_POR_DEVOLUCION} ${devolucion.numero}`;
  return ventas.find((venta) => venta.observaciones.includes(marca)) ?? null;
}

export function cuponesPorDevolucion(
  devolucionId: string,
  cupones: CuponDescuentoRegistrado[],
): CuponDescuentoRegistrado[] {
  return cupones.filter((cupon) => cupon.devolucionId === devolucionId);
}
