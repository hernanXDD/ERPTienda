import { esFormaPagoCuentaCorriente } from '../../datos/formasPago';
import type { FormaPago } from '../../tipos/formaPago';

export interface OpcionFormaPagoCobroCuentaCorriente {
  etiqueta: string;
  codigo: string;
}

/** Medios de cobro/pago en CC (formas habilitadas excepto cuenta corriente). */
export function opcionesFormaPagoCobroCuentaCorriente(
  formas: FormaPago[],
): OpcionFormaPagoCobroCuentaCorriente[] {
  return formas
    .filter((f) => f.habilitado && !esFormaPagoCuentaCorriente(f.codigo))
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
    .map((f) => ({ etiqueta: f.nombre, codigo: f.codigo }));
}
