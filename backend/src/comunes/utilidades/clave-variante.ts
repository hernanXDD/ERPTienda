/** Clave de unicidad por producto: solo talle (el color va en el nombre del artículo). */
export function claveUnicaVariante(talle: string, _color?: string): string {
  return talle.trim().toLowerCase();
}
