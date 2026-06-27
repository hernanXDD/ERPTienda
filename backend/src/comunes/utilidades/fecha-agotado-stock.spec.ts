import { resolverFechaAgotadoStock } from './fecha-agotado-stock';

describe('resolverFechaAgotadoStock', () => {
  const fija = new Date('2026-06-01T12:00:00.000Z');

  it('limpia la fecha al reponer stock', () => {
    expect(resolverFechaAgotadoStock(0, 5, fija, fija)).toBeNull();
  });

  it('marca agotado al pasar de positivo a cero', () => {
    const marca = resolverFechaAgotadoStock(3, 0, null, fija);
    expect(marca?.toISOString()).toBe(fija.toISOString());
  });

  it('conserva la fecha si ya estaba en cero', () => {
    expect(resolverFechaAgotadoStock(0, 0, fija, fija)?.toISOString()).toBe(fija.toISOString());
  });
});
