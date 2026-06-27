import {
  claveComparacionTalleCatalogo,
  inferirTipoTalleCatalogo,
  normalizarCodigoTalleCatalogo,
} from './talle-catalogo';

describe('talle-catalogo', () => {
  describe('claveComparacionTalleCatalogo', () => {
    it('trata mayúsculas y minúsculas como equivalentes', () => {
      expect(claveComparacionTalleCatalogo('XL')).toBe(claveComparacionTalleCatalogo('xL'));
      expect(claveComparacionTalleCatalogo('XL')).toBe(claveComparacionTalleCatalogo('xl'));
    });

    it('recorta espacios al comparar', () => {
      expect(claveComparacionTalleCatalogo('  XL ')).toBe(claveComparacionTalleCatalogo('xl'));
    });
  });

  describe('normalizarCodigoTalleCatalogo', () => {
    it('conserva el texto ingresado al crear', () => {
      expect(normalizarCodigoTalleCatalogo('  xL ')).toBe('xL');
    });
  });

  describe('inferirTipoTalleCatalogo', () => {
    it('clasifica talles de letra sin importar mayúsculas', () => {
      expect(inferirTipoTalleCatalogo('xL')).toBe('LETRA');
      expect(inferirTipoTalleCatalogo('XL')).toBe('LETRA');
    });
  });
});
