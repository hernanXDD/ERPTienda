/** Valores por defecto del modo claro (personalizables por el dueño del negocio). */
export const TEMA_CLARO_POR_DEFECTO = {
  colorAcento: '#4a5fd7',
  colorFondo: '#f2f5fa',
  colorSuperficie: '#ffffff',
  colorCabecera: '#e4eaf4',
  colorTexto: '#0f172a',
  colorBorde: '#cbd5e1',
} as const;

export interface TemaClaroNegocio {
  colorAcento: string;
  colorFondo: string;
  colorSuperficie: string;
  colorCabecera: string;
  colorTexto: string;
  colorBorde: string;
}

export type CamposTemaClaroNegocio = {
  temaClaroColorAcento: string;
  temaClaroColorFondo: string;
  temaClaroColorSuperficie: string;
  temaClaroColorCabecera: string;
  temaClaroColorTexto: string;
  temaClaroColorBorde: string;
};

export function datosTemaClaroNegocioPorDefecto(): CamposTemaClaroNegocio {
  return {
    temaClaroColorAcento: TEMA_CLARO_POR_DEFECTO.colorAcento,
    temaClaroColorFondo: TEMA_CLARO_POR_DEFECTO.colorFondo,
    temaClaroColorSuperficie: TEMA_CLARO_POR_DEFECTO.colorSuperficie,
    temaClaroColorCabecera: TEMA_CLARO_POR_DEFECTO.colorCabecera,
    temaClaroColorTexto: TEMA_CLARO_POR_DEFECTO.colorTexto,
    temaClaroColorBorde: TEMA_CLARO_POR_DEFECTO.colorBorde,
  };
}

export type TemaDocumento = 'oscuro' | 'claro';

export const VARIABLES_COLOR_TEMA = [
  '--color-fondo',
  '--color-fondo-elevado',
  '--color-fondo-cabecera',
  '--color-fondo-sutil',
  '--color-borde',
  '--color-texto',
  '--color-texto-suave',
  '--color-texto-apagado',
  '--color-acento',
  '--color-acento-hover',
  '--color-acento-intenso',
  '--color-acento-suave',
  '--color-acento-borde',
  '--color-texto-sobre-acento',
  '--color-peligro',
  '--color-peligro-suave',
  '--color-peligro-borde',
  '--color-exito',
  '--color-exito-suave',
  '--color-exito-borde',
  '--color-advertencia',
  '--color-advertencia-suave',
  '--color-advertencia-borde',
  '--color-fila-alterna',
  '--color-fila-hover',
  '--color-hover-neutro',
  '--color-scrim',
  '--sombra-suave',
  '--color-sombra-elevada',
] as const;
