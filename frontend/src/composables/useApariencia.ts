import { useTemaStore } from '../stores/tema';

/** Inicializa el tema visual según preferencias del usuario y colores del negocio. */
export function useApariencia() {
  const temaStore = useTemaStore();
  temaStore.iniciarObservadorTema();
  return {
    modoOscuroHabilitado: temaStore.modoOscuroHabilitado,
    establecerModoOscuro: temaStore.establecerModoOscuro,
    alternarModoOscuro: temaStore.alternarModoOscuro,
    sincronizarTema: temaStore.sincronizarTema,
  };
}

export { normalizarTemaClaroNegocio } from '../stores/tema';
