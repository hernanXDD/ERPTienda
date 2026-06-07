import { inject } from 'vue';
import {
  CLAVE_CENTRO_VENTAS,
  type ContextoCentroVentas,
} from '../../composables/useCentroVentas';

export function usarCentroVentasContexto(): ContextoCentroVentas {
  const ctx = inject<ContextoCentroVentas>(CLAVE_CENTRO_VENTAS);
  if (!ctx) {
    throw new Error('CentroVentas: falta el proveedor del contexto en la página.');
  }
  return ctx;
}
