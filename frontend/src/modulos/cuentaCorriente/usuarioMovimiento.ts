import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';

export function idUsuarioDelMovimiento(movimiento: MovimientoCuentaCorriente): string | null {
  return (
    movimiento.auditoriaPago?.idUsuarioSesionRegistrante ??
    movimiento.registradoPor?.idUsuario ??
    null
  );
}

export function etiquetaUsuarioDelMovimiento(movimiento: MovimientoCuentaCorriente): string {
  return (
    movimiento.auditoriaPago?.etiquetaUsuarioRegistrante ??
    movimiento.registradoPor?.etiquetaUsuario ??
    '—'
  );
}
