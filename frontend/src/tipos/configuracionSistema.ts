/** Parámetros operativos configurables por el dueño de la tienda. */
export interface ConfiguracionSistema {
  /** Tope por defecto para nuevas cuentas corrientes (moneda local). */
  maximoCuentaCorriente: number;
  /** Porcentaje sobre costo de compra para sugerir precio de venta. */
  porcentajeGananciaSugerida: number;
  /** Días desde el último cargo para considerar la cuenta en deuda. */
  diasDeudaCuentaCorriente: number;
  /** Existencias iguales o por debajo generan alerta de stock bajo o crítico. */
  stockMinimoAlerta: number;
  /** Habilita entradas manuales de stock (además del permiso por usuario). */
  movimientoManualStockHabilitado: boolean;
}

export interface ConfiguracionSistemaRegistro extends ConfiguracionSistema {
  id: string;
}

export type ConfiguracionSistemaEditable = ConfiguracionSistema;

export const configuracionSistemaPorDefecto = (): ConfiguracionSistemaEditable => ({
  maximoCuentaCorriente: 500_000,
  porcentajeGananciaSugerida: 35,
  diasDeudaCuentaCorriente: 30,
  stockMinimoAlerta: 5,
  movimientoManualStockHabilitado: true,
});

export type DatosConfiguracionSistemaEditable = ConfiguracionSistemaEditable;
