import { useLocalStorage } from '@vueuse/core';

const CLAVE_PREFERENCIA = 'erp-barra-lateral-fijada';

export function useBarraLateral() {
  const barraLateralFijada = useLocalStorage(CLAVE_PREFERENCIA, true);

  function alternarFijacionBarraLateral() {
    barraLateralFijada.value = !barraLateralFijada.value;
  }

  return { barraLateralFijada, alternarFijacionBarraLateral };
}
