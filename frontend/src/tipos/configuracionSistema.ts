/** Parámetros operativos configurables por el dueño de la tienda. */
import type { PlantillaCupon } from './plantillaCupon';
import { PLANTILLA_CUPON_POR_DEFECTO } from './plantillaCupon';

export interface ConfiguracionSistema {
  /** Tope por defecto para nuevas cuentas corrientes (moneda local). */
  maximoCuentaCorriente: number;
  /** Porcentaje sobre costo de compra para sugerir precio de venta. */
  porcentajeGananciaSugerida: number;
  /** Días desde el último cargo para considerar la cuenta en deuda. */
  diasDeudaCuentaCorriente: number;
  /** Días desde la venta dentro de los cuales se permite registrar una devolución. */
  diasPlazoDevolucion: number;
  /** Existencias iguales o por debajo generan alerta de stock bajo o crítico. */
  stockMinimoAlerta: number;
  /** Habilita entradas manuales de stock (además del permiso por usuario). */
  movimientoManualStockHabilitado: boolean;
  /** Diseño visual de los cupones de descuento impresos o compartidos. */
  plantillaCupon: PlantillaCupon;
}

export interface ConfiguracionSistemaRegistro extends ConfiguracionSistema {
  id: string;
}

export type ConfiguracionSistemaEditable = ConfiguracionSistema;

export const configuracionSistemaPorDefecto = (): ConfiguracionSistemaEditable => ({
  maximoCuentaCorriente: 500_000,
  porcentajeGananciaSugerida: 35,
  diasDeudaCuentaCorriente: 30,
  diasPlazoDevolucion: 30,
  stockMinimoAlerta: 5,
  movimientoManualStockHabilitado: true,
  plantillaCupon: PLANTILLA_CUPON_POR_DEFECTO,
});

export type DatosConfiguracionSistemaEditable = ConfiguracionSistemaEditable;
