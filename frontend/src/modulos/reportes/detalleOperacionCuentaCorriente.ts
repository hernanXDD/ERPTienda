import type { CompraRegistrada } from '../../tipos/compraRegistrada';
import type { VentaRegistrada } from '../../tipos/venta';
import { formatearMonedaReporte } from './formatoMonedaReporte';

export interface FilaLineaDetalleOperacionCcReporte {
  nombre: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: string;
}

export interface DetalleOperacionCcReporte {
  titulo: string;
  lineas: FilaLineaDetalleOperacionCcReporte[];
  total: string;
}

const PATRON_VENTA = /^Venta\s+(.+)$/i;
const PATRON_COMPRA = /^Compra\s+(.+)$/i;

export function indiceVentasPorNumero(ventas: VentaRegistrada[]): Map<string, VentaRegistrada> {
  return new Map(ventas.map((venta) => [venta.numero.trim(), venta]));
}

export function indiceComprasPorNumero(compras: CompraRegistrada[]): Map<string, CompraRegistrada> {
  return new Map(compras.map((compra) => [compra.numero.trim(), compra]));
}

function armarDetalleDesdeVenta(venta: VentaRegistrada): DetalleOperacionCcReporte {
  const lineas = venta.lineas ?? [];
  return {
    titulo: `Venta ${venta.numero}`,
    lineas: lineas.map((linea) => ({
      nombre: linea.nombre,
      cantidad: String(linea.cantidad),
      precioUnitario: formatearMonedaReporte(linea.precioUnitario),
      subtotal: formatearMonedaReporte(linea.subtotal),
    })),
    total: formatearMonedaReporte(venta.total),
  };
}

function armarDetalleDesdeCompra(compra: CompraRegistrada): DetalleOperacionCcReporte {
  const lineas = compra.lineas ?? [];
  return {
    titulo: `Compra ${compra.numero}`,
    lineas: lineas.map((linea) => ({
      nombre: linea.nombre,
      cantidad: String(linea.cantidad),
      precioUnitario: formatearMonedaReporte(linea.costoUnitario),
      subtotal: formatearMonedaReporte(linea.subtotal),
    })),
    total: formatearMonedaReporte(compra.total),
  };
}

export function resolverDetalleOperacionCliente(
  descripcion: string,
  tipoMovimiento: 'cargo' | 'pagoRegistrado',
  clienteId: string,
  ventasPorNumero: Map<string, VentaRegistrada>,
): DetalleOperacionCcReporte | null {
  if (tipoMovimiento !== 'cargo') return null;

  const coincidencia = descripcion.trim().match(PATRON_VENTA);
  if (!coincidencia) return null;

  const venta = ventasPorNumero.get(coincidencia[1].trim());
  if (!venta || venta.clienteId !== clienteId) return null;

  return armarDetalleDesdeVenta(venta);
}

export function resolverDetalleOperacionProveedor(
  descripcion: string,
  tipoMovimiento: 'cargo' | 'pagoRegistrado',
  proveedorId: string,
  comprasPorNumero: Map<string, CompraRegistrada>,
): DetalleOperacionCcReporte | null {
  if (tipoMovimiento !== 'cargo') return null;

  const coincidencia = descripcion.trim().match(PATRON_COMPRA);
  if (!coincidencia) return null;

  const compra = comprasPorNumero.get(coincidencia[1].trim());
  if (!compra || compra.proveedorId !== proveedorId) return null;

  return armarDetalleDesdeCompra(compra);
}
