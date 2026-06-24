import type { ConfiguracionSistemaEditable } from '../../tipos/configuracionSistema';
import { configuracionSistemaPorDefecto } from '../../tipos/configuracionSistema';
import { normalizarPlantillaCupon } from '../../tipos/plantillaCupon';
import { normalizarLimiteCuentaCorriente } from '../clientes/formateadorEntradaCliente';

export function normalizarPorcentajeGananciaSugerida(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  if (valor > 999) return 999;
  return Math.round(valor * 10) / 10;
}

export function normalizarDiasDeudaCuentaCorriente(valor: number): number {
  if (!Number.isFinite(valor) || valor < 1) return 1;
  if (valor > 365) return 365;
  return Math.floor(valor);
}

export function normalizarDiasPlazoDevolucion(valor: number): number {
  return normalizarDiasDeudaCuentaCorriente(valor);
}

export function normalizarStockMinimoAlerta(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  if (valor > 9999) return 9999;
  return Math.floor(valor);
}

export function normalizarConfiguracionSistemaEditable(
  datos: ConfiguracionSistemaEditable,
): ConfiguracionSistemaEditable {
  return {
    maximoCuentaCorriente: normalizarLimiteCuentaCorriente(datos.maximoCuentaCorriente),
    porcentajeGananciaSugerida: normalizarPorcentajeGananciaSugerida(datos.porcentajeGananciaSugerida),
    diasDeudaCuentaCorriente: normalizarDiasDeudaCuentaCorriente(datos.diasDeudaCuentaCorriente),
    diasPlazoDevolucion: normalizarDiasPlazoDevolucion(datos.diasPlazoDevolucion),
    stockMinimoAlerta: normalizarStockMinimoAlerta(datos.stockMinimoAlerta),
    movimientoManualStockHabilitado: datos.movimientoManualStockHabilitado === true,
    plantillaCupon: normalizarPlantillaCupon(datos.plantillaCupon),
  };
}

export function parametrosSistemaResueltos(
  configuracion: ConfiguracionSistemaEditable | null | undefined,
): ConfiguracionSistemaEditable {
  if (!configuracion) return configuracionSistemaPorDefecto();
  return normalizarConfiguracionSistemaEditable(configuracion);
}
