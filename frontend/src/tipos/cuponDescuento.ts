export type EstadoCuponDescuento = 'activo' | 'usado' | 'anulado';

export type TipoDescuentoCupon = 'porcentaje' | 'monto_fijo';

export interface CuponDescuentoRegistrado {
  id: string;
  numero: string;
  tipoDescuento: TipoDescuentoCupon;
  porcentajeDescuento: number | null;
  montoDescuento: number | null;
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar: string;
  estado: EstadoCuponDescuento;
  devolucionId: string | null;
  numeroDevolucion: string | null;
  ventaOrigenId: string | null;
  numeroVentaOrigen: string | null;
  ventaUsadaId: string | null;
  numeroVentaUsada: string | null;
  observaciones: string;
  fecha: string;
  fechaVencimiento: string;
}

export interface CuponDescuentoCreado extends CuponDescuentoRegistrado {
  codigo: string;
}

export interface DatosCrearCuponDescuento {
  tipoDescuento: TipoDescuentoCupon;
  porcentajeDescuento?: number;
  montoDescuento?: number;
  fechaVencimiento: string;
  clienteId?: string | null;
  nombreClienteMostrar?: string;
  documentoClienteMostrar?: string;
  devolucionId?: string | null;
  observaciones?: string;
}

const formatoPesoCupon = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export function formatearPorcentajeCupon(valor: number): string {
  return `${valor % 1 === 0 ? valor.toFixed(0) : valor.toFixed(2).replace(/\.?0+$/, '')}%`;
}

export function etiquetaValorDescuentoCupon(
  cupon: Pick<CuponDescuentoRegistrado, 'tipoDescuento' | 'porcentajeDescuento' | 'montoDescuento'>,
): string {
  if (cupon.tipoDescuento === 'monto_fijo' && cupon.montoDescuento != null) {
    return formatoPesoCupon.format(cupon.montoDescuento);
  }
  if (cupon.porcentajeDescuento != null) {
    return formatearPorcentajeCupon(cupon.porcentajeDescuento);
  }
  return '—';
}

export function etiquetaTipoDescuentoCupon(tipo: TipoDescuentoCupon): string {
  return tipo === 'monto_fijo' ? 'Monto fijo' : 'Porcentaje';
}

export function calcularAjusteCuponEnTicket(
  cupon: Pick<CuponDescuentoRegistrado, 'tipoDescuento' | 'porcentajeDescuento' | 'montoDescuento'>,
  subtotal: number,
): { ajusteMonto: number; ajustePorcentaje: number | null } {
  const subtotalRedondeado = Math.round(subtotal);
  if (subtotalRedondeado <= 0) {
    return { ajusteMonto: 0, ajustePorcentaje: null };
  }

  if (cupon.tipoDescuento === 'monto_fijo' && cupon.montoDescuento != null) {
    const monto = Math.min(Math.round(cupon.montoDescuento), subtotalRedondeado);
    return { ajusteMonto: -monto, ajustePorcentaje: null };
  }

  if (cupon.porcentajeDescuento != null) {
    const porcentaje = cupon.porcentajeDescuento;
    const monto = Math.min(Math.round(subtotalRedondeado * (porcentaje / 100)), subtotalRedondeado);
    return { ajusteMonto: -monto, ajustePorcentaje: porcentaje };
  }

  return { ajusteMonto: 0, ajustePorcentaje: null };
}

export function mensajeCuponAplicado(
  cupon: Pick<CuponDescuentoRegistrado, 'numero' | 'tipoDescuento' | 'porcentajeDescuento' | 'montoDescuento'>,
): string {
  const valor = etiquetaValorDescuentoCupon(cupon);
  if (cupon.tipoDescuento === 'monto_fijo') {
    return `Cupón ${cupon.numero} aplicado: ${valor} de descuento.`;
  }
  return `Cupón ${cupon.numero} aplicado: ${valor} de descuento.`;
}

export function cuponEstaVencido(cupon: Pick<CuponDescuentoRegistrado, 'fechaVencimiento' | 'estado'>): boolean {
  if (cupon.estado !== 'activo') return false;
  return new Date(cupon.fechaVencimiento).getTime() < Date.now();
}
