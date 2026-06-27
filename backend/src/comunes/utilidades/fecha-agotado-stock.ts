/** Marca inicial al crear stock en cero (variante nueva sin existencias). */
export function crearFechaAgotadoInicial(ahora: Date = new Date()): Date {
  return ahora;
}

/** Calcula la marca de agotado al cambiar el saldo de una variante. */
export function resolverFechaAgotadoStock(
  cantidadAnterior: number,
  cantidadNueva: number,
  fechaAgotadoActual: Date | null,
  ahora: Date = new Date(),
): Date | null {
  if (cantidadNueva > 0) return null;
  if (cantidadAnterior > 0) return ahora;
  return fechaAgotadoActual ?? ahora;
}
