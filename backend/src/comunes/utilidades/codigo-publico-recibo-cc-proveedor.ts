/** Código público para correlacionar comprobantes de pago a proveedores en cuenta corriente. */
export function crearCodigoPublicoReciboPagoCuentaCorrienteProveedor(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const sufijo = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `REP-${y}${mes}${dia}-${sufijo}`;
}
