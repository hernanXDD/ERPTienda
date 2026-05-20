export function claveUnicaVariante(talle: string, color: string): string {
  return `${talle.trim().toLowerCase()}|${color.trim().toLowerCase()}`;
}
