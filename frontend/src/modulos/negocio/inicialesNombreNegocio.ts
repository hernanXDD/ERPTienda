/** Iniciales para el escudo de marca en navegación (máx. 2 letras). */
export function inicialesNombreNegocio(nombre: string): string {
  const limpio = nombre.trim();
  if (!limpio) return 'T';

  const partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase();
}
