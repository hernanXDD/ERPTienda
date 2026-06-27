import { describe, expect, it } from 'vitest';
import { FORMAS_PAGO_SEMILLA } from '../../../datos/formasPago';
import { resolverCodigoFormaPagoDesdeEtiquetaCc } from '../../clientes/resolverCodigoFormaPagoDesdeEtiquetaCc';

describe('resolverCodigoFormaPagoDesdeEtiquetaCc', () => {
  it('mapea etiquetas del recibo CC a códigos del sistema', () => {
    expect(resolverCodigoFormaPagoDesdeEtiquetaCc('Efectivo', FORMAS_PAGO_SEMILLA)).toBe('EFECTIVO');
    expect(resolverCodigoFormaPagoDesdeEtiquetaCc('Transferencia bancaria', FORMAS_PAGO_SEMILLA)).toBe(
      'TRANSFERENCIA',
    );
    expect(resolverCodigoFormaPagoDesdeEtiquetaCc('Tarjeta de débito', FORMAS_PAGO_SEMILLA)).toBe('DEBITO');
  });

  it('rechaza medios no configurados', () => {
    expect(resolverCodigoFormaPagoDesdeEtiquetaCc('Otro', FORMAS_PAGO_SEMILLA)).toBeNull();
  });
});
