import { useFormasPagoStore } from '../stores/formasPago';

/** Etiqueta legible de forma de pago según configuración del sistema. */
export function useEtiquetaFormaPago(): (codigo: string) => string {
  const formasPagoStore = useFormasPagoStore();
  return (codigo: string) => formasPagoStore.etiqueta(codigo);
}
