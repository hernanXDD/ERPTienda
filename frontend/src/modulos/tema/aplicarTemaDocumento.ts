import { variablesCssTemaClaro } from './variablesTemaClaro';
import {
  TEMA_CLARO_POR_DEFECTO,
  VARIABLES_COLOR_TEMA,
  type TemaClaroNegocio,
  type TemaDocumento,
} from './temaClaroPorDefecto';

function limpiarVariablesPersonalizadas(elemento: HTMLElement): void {
  for (const variable of VARIABLES_COLOR_TEMA) {
    elemento.style.removeProperty(variable);
  }
}

export function aplicarTemaDocumento(opciones: {
  modoOscuro: boolean;
  temaClaro?: TemaClaroNegocio | null;
}): void {
  const html = document.documentElement;
  const tema: TemaDocumento = opciones.modoOscuro ? 'oscuro' : 'claro';
  html.dataset.tema = tema;
  limpiarVariablesPersonalizadas(html);

  if (tema === 'claro') {
    const base = opciones.temaClaro ?? TEMA_CLARO_POR_DEFECTO;
    const variables = variablesCssTemaClaro(base);
    for (const [nombre, valor] of Object.entries(variables)) {
      html.style.setProperty(nombre, valor);
    }
  }
}

export function restablecerTemaOscuroPorDefecto(): void {
  aplicarTemaDocumento({ modoOscuro: true });
}

export function temaClaroDesdeNegocio(
  negocio: Partial<TemaClaroNegocio> | null | undefined,
): TemaClaroNegocio {
  return {
    colorAcento: negocio?.colorAcento ?? TEMA_CLARO_POR_DEFECTO.colorAcento,
    colorFondo: negocio?.colorFondo ?? TEMA_CLARO_POR_DEFECTO.colorFondo,
    colorSuperficie: negocio?.colorSuperficie ?? TEMA_CLARO_POR_DEFECTO.colorSuperficie,
    colorCabecera: negocio?.colorCabecera ?? TEMA_CLARO_POR_DEFECTO.colorCabecera,
    colorTexto: negocio?.colorTexto ?? TEMA_CLARO_POR_DEFECTO.colorTexto,
    colorBorde: negocio?.colorBorde ?? TEMA_CLARO_POR_DEFECTO.colorBorde,
  };
}
