import JsBarcode from 'jsbarcode';

export interface OpcionesSvgCodigoBarrasCupon {
  /** Ancho de cada barra (módulo). Valores más altos = más fácil de escanear en pantalla. */
  anchoModulo?: number;
  /** Alto de las barras en px. */
  alto?: number;
}

/** Genera SVG inline del código de barras CODE128 para incrustar en la plantilla Eta. */
export function generarSvgCodigoBarrasCupon(
  codigo: string,
  opciones: OpcionesSvgCodigoBarrasCupon = {},
): string {
  const limpio = codigo.trim();
  if (!limpio) return '';

  const anchoModulo = opciones.anchoModulo ?? 4;
  const alto = opciones.alto ?? 130;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, limpio, {
    format: 'CODE128',
    displayValue: false,
    font: 'monospace',
    fontSize: 16,
    textMargin: 10,
    margin: 20,
    height: alto,
    width: anchoModulo,
    background: '#ffffff',
    lineColor: '#000000',
  });
  return svg.outerHTML;
}
