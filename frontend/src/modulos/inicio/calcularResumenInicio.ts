import type { Cliente } from '../../tipos/cliente';
import type { Variante } from '../../tipos/catalogo';
import type { VentaRegistrada } from '../../tipos/venta';
import { obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';

/** Mismo criterio que Stock actual para “stock bajo”. */
export const UMBRAL_STOCK_BAJO = 12;

export interface KpisVentasDia {
  cantidadVentas: number;
  totalImporte: number;
  ticketPromedio: number;
  unidadesVendidas: number;
}

export interface AlertasStockInicio {
  variantesAgotadas: number;
  variantesStockBajo: number;
}

export function formatearFechaTituloInicio(fecha: Date = new Date()): string {
  const texto = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function filtrarVentasDelDia(
  ventas: VentaRegistrada[],
  diaComparable: string
): VentaRegistrada[] {
  return ventas.filter((v) => obtenerDiaComparableDesdeValor(v.fecha) === diaComparable);
}

export function calcularKpisVentasDia(ventasDelDia: VentaRegistrada[]): KpisVentasDia {
  const cantidadVentas = ventasDelDia.length;
  const totalImporte = ventasDelDia.reduce((acum, v) => acum + v.total, 0);
  const unidadesVendidas = ventasDelDia.reduce(
    (acum, v) => acum + v.lineas.reduce((s, ln) => s + ln.cantidad, 0),
    0
  );
  const ticketPromedio = cantidadVentas > 0 ? totalImporte / cantidadVentas : 0;
  return {
    cantidadVentas,
    totalImporte,
    ticketPromedio,
    unidadesVendidas,
  };
}

export function calcularAlertasStock(
  variantesActivas: Variante[],
  cantidadActual: (varianteId: string) => number
): AlertasStockInicio {
  let variantesAgotadas = 0;
  let variantesStockBajo = 0;
  for (const v of variantesActivas) {
    const existencia = cantidadActual(v.id);
    if (existencia === 0) variantesAgotadas += 1;
    else if (existencia <= UMBRAL_STOCK_BAJO) variantesStockBajo += 1;
  }
  return { variantesAgotadas, variantesStockBajo };
}

export function contarClientesConSaldoDeudor(
  clientes: Cliente[],
  saldoCliente: (clienteId: string) => number
): number {
  return clientes.filter((c) => c.habilitado && saldoCliente(c.id) > 0).length;
}
