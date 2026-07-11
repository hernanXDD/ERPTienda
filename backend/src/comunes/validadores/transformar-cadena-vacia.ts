/** Trata cadenas vacías o solo espacios como `undefined` (útil con @IsOptional). */
export function transformarCadenaVaciaComoUndefined({
  value,
}: {
  value: unknown;
}): unknown {
  if (typeof value !== 'string') return value;
  return value.trim() === '' ? undefined : value;
}
