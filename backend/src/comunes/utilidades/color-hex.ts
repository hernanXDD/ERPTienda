const PATRON_COLOR_HEX = /^#[0-9A-Fa-f]{6}$/;

export function esColorHexValido(valor: string): boolean {
  return PATRON_COLOR_HEX.test(valor.trim());
}

export function normalizarColorHex(valor: string | undefined, porDefecto: string): string {
  const limpio = (valor ?? '').trim();
  if (!esColorHexValido(limpio)) return porDefecto.toLowerCase();
  return limpio.toLowerCase();
}
