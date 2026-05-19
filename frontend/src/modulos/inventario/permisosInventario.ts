import type { RolUsuario } from '../../tipos/sesion';

/**
 * Quién puede ejecutar conciliación física y corregir existencias fuera del flujo de venta/compra.
 */
export function usuarioPuedeAjustarStock(rolUsuario: RolUsuario | undefined): boolean {
  return rolUsuario === 'ADMIN' || rolUsuario === 'DUEÑO';
}
