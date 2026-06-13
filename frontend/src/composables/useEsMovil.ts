import { useMediaQuery } from '@vueuse/core';
import { MEDIA_VISTA_MOVIL } from '../modulos/nucleo/puntoCorteVista';

export function useEsMovil() {
  return useMediaQuery(MEDIA_VISTA_MOVIL);
}
