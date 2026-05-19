/** Código público estable para correlacionar futuros PDF/recibos (único por registro). */
export function crearCodigoPublicoReciboPagoCuentaCorriente(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const sufijo = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `REC-${y}${mes}${dia}-${sufijo}`;
}
