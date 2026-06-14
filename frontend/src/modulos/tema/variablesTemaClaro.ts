import { mezclarHex, oscurecerHex, rgbaDesdeHex } from './colorUtilidades';
import type { TemaClaroNegocio } from './temaClaroPorDefecto';

export function variablesCssTemaClaro(tema: TemaClaroNegocio): Record<string, string> {
  const acento = tema.colorAcento;
  const fondo = tema.colorFondo;
  const superficie = tema.colorSuperficie;
  const texto = tema.colorTexto;
  const borde = tema.colorBorde;
  const peligro = '#e11d48';
  const exito = '#16a34a';
  const advertencia = '#d97706';

  return {
    '--color-fondo': fondo,
    '--color-fondo-elevado': superficie,
    '--color-fondo-cabecera': tema.colorCabecera,
    '--color-fondo-sutil': oscurecerHex(fondo, 0.05),
    '--color-borde': borde,
    '--color-texto': texto,
    '--color-texto-suave': mezclarHex(texto, fondo, 0.35),
    '--color-texto-apagado': mezclarHex(texto, fondo, 0.55),
    '--color-acento': acento,
    '--color-acento-hover': oscurecerHex(acento, 0.14),
    '--color-acento-intenso': oscurecerHex(acento, 0.24),
    '--color-acento-suave': rgbaDesdeHex(acento, 0.12),
    '--color-acento-borde': rgbaDesdeHex(acento, 0.35),
    '--color-texto-sobre-acento': '#f8fafc',
    '--color-peligro': peligro,
    '--color-peligro-suave': rgbaDesdeHex(peligro, 0.1),
    '--color-peligro-borde': rgbaDesdeHex(peligro, 0.35),
    '--color-exito': exito,
    '--color-exito-suave': rgbaDesdeHex(exito, 0.1),
    '--color-exito-borde': rgbaDesdeHex(exito, 0.28),
    '--color-advertencia': advertencia,
    '--color-advertencia-suave': rgbaDesdeHex(advertencia, 0.1),
    '--color-advertencia-borde': rgbaDesdeHex(advertencia, 0.35),
    '--color-fila-alterna': rgbaDesdeHex(acento, 0.04),
    '--color-fila-hover': rgbaDesdeHex(acento, 0.08),
    '--color-hover-neutro': oscurecerHex(fondo, 0.08),
    '--color-scrim': 'rgba(15, 23, 42, 0.45)',
    '--sombra-suave': '0 2px 16px rgba(15, 23, 42, 0.12)',
    '--color-sombra-elevada': '0 10px 24px rgba(15, 23, 42, 0.12)',
  };
}
