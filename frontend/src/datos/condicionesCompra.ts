import type { IdCondicionCompra } from '../tipos/compraRegistrada';

export function etiquetaCondicionCompra(id: IdCondicionCompra): string {
  switch (id) {
    case 'CONTADO':
      return 'Contado';
    case 'CUENTA_PROVEEDOR':
      return 'Cuenta proveedor';
  }
}
