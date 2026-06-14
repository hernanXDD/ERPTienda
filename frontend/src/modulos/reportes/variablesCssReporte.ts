import { mezclarHex, oscurecerHex } from '../tema/colorUtilidades';
import type { TemaClaroNegocio } from '../tema/temaClaroPorDefecto';

/** Variables CSS del reporte (siempre modo claro del negocio, independiente del tema de la app). */
export function variablesCssReporte(tema: TemaClaroNegocio): Record<string, string> {
  const acento = tema.colorAcento;
  const fondo = tema.colorFondo;
  const superficie = tema.colorSuperficie;
  const cabecera = tema.colorCabecera;
  const texto = tema.colorTexto;
  const borde = tema.colorBorde;
  const acentoIntenso = oscurecerHex(acento, 0.24);
  const acentoMuyIntenso = oscurecerHex(acento, 0.38);

  return {
    '--rep-texto': texto,
    '--rep-texto-medio': mezclarHex(texto, fondo, 0.35),
    '--rep-texto-suave': mezclarHex(texto, fondo, 0.45),
    '--rep-texto-apagado': mezclarHex(texto, fondo, 0.55),
    '--rep-texto-sep': mezclarHex(texto, fondo, 0.65),
    '--rep-fondo': superficie,
    '--rep-fondo-alt': fondo,
    '--rep-fondo-cabecera': cabecera,
    '--rep-acento': acento,
    '--rep-acento-intenso': acentoIntenso,
    '--rep-acento-muy-intenso': acentoMuyIntenso,
    '--rep-borde': borde,
    '--rep-borde-claro': mezclarHex(borde, fondo, 0.45),
    '--rep-texto-sobre-acento': '#f8fafc',
    '--rep-sombra-enc': '0 2px 8px rgba(15, 23, 42, 0.06)',
    '--rep-gradiente-enc': `linear-gradient(180deg, ${superficie} 0%, ${fondo} 100%)`,
    '--rep-gradiente-logo': `linear-gradient(145deg, ${acento} 0%, ${acentoMuyIntenso} 100%)`,
    '--rep-gradiente-kpi': `linear-gradient(180deg, ${superficie} 0%, ${fondo} 100%)`,
    '--rep-gradiente-acento': `linear-gradient(180deg, ${acento} 0%, ${acentoIntenso} 100%)`,
  };
}

export function bloqueVariablesCssReporte(tema: TemaClaroNegocio): string {
  const declaraciones = Object.entries(variablesCssReporte(tema))
    .map(([nombre, valor]) => `  ${nombre}: ${valor};`)
    .join('\n');
  return `.rep-doc {\n${declaraciones}\n}`;
}
