interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function esColorHexValido(valor: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(valor.trim());
}

export function normalizarColorHex(valor: string, porDefecto: string): string {
  const limpio = valor.trim();
  if (!esColorHexValido(limpio)) return porDefecto.toLowerCase();
  return limpio.toLowerCase();
}

function hexARgb(hex: string): Rgb {
  const limpio = hex.replace('#', '');
  return {
    r: Number.parseInt(limpio.slice(0, 2), 16),
    g: Number.parseInt(limpio.slice(2, 4), 16),
    b: Number.parseInt(limpio.slice(4, 6), 16),
  };
}

function rgbAHex({ r, g, b }: Rgb): string {
  const canal = (valor: number) => valor.toString(16).padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

export function mezclarHex(base: string, mezcla: string, pesoMezcla: number): string {
  const a = hexARgb(base);
  const b = hexARgb(mezcla);
  const peso = Math.min(Math.max(pesoMezcla, 0), 1);
  return rgbAHex({
    r: Math.round(a.r * (1 - peso) + b.r * peso),
    g: Math.round(a.g * (1 - peso) + b.g * peso),
    b: Math.round(a.b * (1 - peso) + b.b * peso),
  });
}

export function rgbaDesdeHex(hex: string, alpha: number): string {
  const { r, g, b } = hexARgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function oscurecerHex(hex: string, factor = 0.12): string {
  return mezclarHex(hex, '#000000', factor);
}

export function aclararHex(hex: string, factor = 0.12): string {
  return mezclarHex(hex, '#ffffff', factor);
}
