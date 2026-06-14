import { defineStore, storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import {
  aplicarTemaDocumento,
  restablecerTemaOscuroPorDefecto,
  temaClaroDesdeNegocio,
} from '../modulos/tema/aplicarTemaDocumento';
import { normalizarColorHex } from '../modulos/tema/colorUtilidades';
import { TEMA_CLARO_POR_DEFECTO } from '../modulos/tema/temaClaroPorDefecto';
import { actualizarPreferenciasAparienciaApi } from '../servicios/autenticacion.servicio';
import { NOMBRE_RUTA_LOGIN } from '../modulos/tema/variablesTemaLogin';
import router from '../router';
import { useNegocioStore } from './negocio';
import { useSesionStore } from './sesion';

type NombreRuta = string | symbol | null | undefined;

function esRutaLogin(nombreRuta: NombreRuta): boolean {
  return nombreRuta === NOMBRE_RUTA_LOGIN;
}

export function normalizarTemaClaroNegocio(datos: {
  temaClaroColorAcento?: string;
  temaClaroColorFondo?: string;
  temaClaroColorSuperficie?: string;
  temaClaroColorCabecera?: string;
  temaClaroColorTexto?: string;
  temaClaroColorBorde?: string;
}) {
  return {
    colorAcento: normalizarColorHex(
      datos.temaClaroColorAcento ?? TEMA_CLARO_POR_DEFECTO.colorAcento,
      TEMA_CLARO_POR_DEFECTO.colorAcento,
    ),
    colorFondo: normalizarColorHex(
      datos.temaClaroColorFondo ?? TEMA_CLARO_POR_DEFECTO.colorFondo,
      TEMA_CLARO_POR_DEFECTO.colorFondo,
    ),
    colorSuperficie: normalizarColorHex(
      datos.temaClaroColorSuperficie ?? TEMA_CLARO_POR_DEFECTO.colorSuperficie,
      TEMA_CLARO_POR_DEFECTO.colorSuperficie,
    ),
    colorCabecera: normalizarColorHex(
      datos.temaClaroColorCabecera ?? TEMA_CLARO_POR_DEFECTO.colorCabecera,
      TEMA_CLARO_POR_DEFECTO.colorCabecera,
    ),
    colorTexto: normalizarColorHex(
      datos.temaClaroColorTexto ?? TEMA_CLARO_POR_DEFECTO.colorTexto,
      TEMA_CLARO_POR_DEFECTO.colorTexto,
    ),
    colorBorde: normalizarColorHex(
      datos.temaClaroColorBorde ?? TEMA_CLARO_POR_DEFECTO.colorBorde,
      TEMA_CLARO_POR_DEFECTO.colorBorde,
    ),
  };
}

export const useTemaStore = defineStore('tema', () => {
  const sesionStore = useSesionStore();
  const negocioStore = useNegocioStore();
  let observadorIniciado = false;

  const modoOscuroHabilitado = computed(
    () => sesionStore.usuario?.modoOscuroHabilitado !== false,
  );

  function sincronizarTema(nombreRuta: NombreRuta = router.currentRoute.value.name): void {
    if (!sesionStore.inicializado) {
      restablecerTemaOscuroPorDefecto();
      return;
    }

    if (!sesionStore.usuario || esRutaLogin(nombreRuta)) {
      restablecerTemaOscuroPorDefecto();
      return;
    }

    const temaClaro = temaClaroDesdeNegocio(
      negocioStore.negocio
        ? normalizarTemaClaroNegocio(negocioStore.negocio)
        : TEMA_CLARO_POR_DEFECTO,
    );

    aplicarTemaDocumento({
      modoOscuro: modoOscuroHabilitado.value,
      temaClaro,
    });
  }

  function iniciarObservadorTema(): void {
    if (observadorIniciado) return;
    observadorIniciado = true;

    const { usuario, inicializado } = storeToRefs(sesionStore);
    const { negocio } = storeToRefs(negocioStore);

    watch(
      [usuario, negocio, modoOscuroHabilitado, inicializado],
      () => sincronizarTema(),
      { immediate: true },
    );
  }

  async function establecerModoOscuro(habilitado: boolean): Promise<void> {
    if (!sesionStore.usuario || habilitado === modoOscuroHabilitado.value) return;
    const respuesta = await actualizarPreferenciasAparienciaApi({
      modoOscuroHabilitado: habilitado,
    });
    sesionStore.usuario = respuesta.usuario;
    sincronizarTema();
  }

  async function alternarModoOscuro(): Promise<void> {
    await establecerModoOscuro(!modoOscuroHabilitado.value);
  }

  return {
    modoOscuroHabilitado,
    iniciarObservadorTema,
    sincronizarTema,
    establecerModoOscuro,
    alternarModoOscuro,
  };
});
