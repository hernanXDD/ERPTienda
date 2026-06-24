/** Fecha ISO fin del día para vencimiento de cupón (plazo en días desde hoy). */
export function fechaVencimientoCuponDesdeHoy(diasPlazo: number): string {
  const dias = Math.max(1, Math.floor(diasPlazo));
  const fin = new Date();
  fin.setDate(fin.getDate() + dias);
  fin.setHours(23, 59, 59, 999);
  return fin.toISOString();
}
