import { storeToRefs } from 'pinia';
import { computed, onUnmounted, ref, watch } from 'vue';
import { obtenerLogoNegocioApi } from '../servicios/negocio.servicio';
import { useNegocioStore } from '../stores/negocio';

/** Vista previa del logo del negocio (blob autenticado desde la API). */
export function useLogoNegocio() {
  const negocioStore = useNegocioStore();
  const { negocio } = storeToRefs(negocioStore);

  const urlLogo = ref('');
  let urlObjeto: string | null = null;

  const tieneLogo = computed(() => negocio.value?.tieneLogo === true);

  function liberarLogo(): void {
    if (urlObjeto) {
      URL.revokeObjectURL(urlObjeto);
      urlObjeto = null;
    }
    urlLogo.value = '';
  }

  async function cargarLogo(): Promise<void> {
    liberarLogo();
    if (!negocio.value?.tieneLogo) return;
    try {
      const blob = await obtenerLogoNegocioApi();
      urlObjeto = URL.createObjectURL(blob);
      urlLogo.value = urlObjeto;
    } catch {
      liberarLogo();
    }
  }

  watch(
    () => [negocio.value?.tieneLogo, negocio.value?.logoVersion] as const,
    () => {
      void cargarLogo();
    },
  );

  onUnmounted(() => {
    liberarLogo();
  });

  return {
    urlLogo,
    tieneLogo,
    cargarLogo,
    liberarLogo,
  };
}
