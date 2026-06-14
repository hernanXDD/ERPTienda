import { describe, expect, it } from 'vitest';
import { TEMA_CLARO_POR_DEFECTO } from '../tema/temaClaroPorDefecto';
import { bloqueVariablesCssReporte, variablesCssReporte } from './variablesCssReporte';

describe('variablesCssReporte', () => {
  it('usa los colores del tema claro del negocio', () => {
    const tema = {
      colorAcento: '#112233',
      colorFondo: '#aabbcc',
      colorSuperficie: '#ddeeff',
      colorCabecera: '#ccddee',
      colorTexto: '#223344',
      colorBorde: '#8899aa',
    };

    const variables = variablesCssReporte(tema);

    expect(variables['--rep-acento']).toBe('#112233');
    expect(variables['--rep-fondo']).toBe('#ddeeff');
    expect(variables['--rep-fondo-alt']).toBe('#aabbcc');
    expect(variables['--rep-fondo-cabecera']).toBe('#ccddee');
    expect(variables['--rep-texto']).toBe('#223344');
    expect(variables['--rep-borde']).toBe('#8899aa');
    expect(variables['--rep-gradiente-acento']).toContain('#112233');
  });

  it('genera bloque CSS aplicable a .rep-doc', () => {
    const bloque = bloqueVariablesCssReporte(TEMA_CLARO_POR_DEFECTO);

    expect(bloque).toMatch(/^\.rep-doc \{/);
    expect(bloque).toContain('--rep-acento: #4a5fd7;');
    expect(bloque).toContain('--rep-fondo: #ffffff;');
  });
});
