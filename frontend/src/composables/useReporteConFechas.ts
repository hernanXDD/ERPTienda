import { onMounted, ref, watch } from 'vue';
import type { FiltroFechasReporte } from '../modulos/reportes/filtroFechasReporte';
import { esRangoFechasValido } from '../modulos/reportes/filtroFechasReporte';
import {
  prepararRenderizadoReporte,
  renderizarPlantillaReporte,
} from '../modulos/reportes/motorEtaReportes';

export function useReporteConFiltros<T extends FiltroFechasReporte>(
  plantilla: string,
  crearFiltroInicial: () => T,
  calcularDatos: (filtro: T) => object
) {
  const filtro = ref(crearFiltroInicial()) as import('vue').Ref<T>;
  const htmlReporte = ref('');
  const errorFiltro = ref('');

  async function actualizarReporte(): Promise<void> {
    if (!esRangoFechasValido(filtro.value)) {
      errorFiltro.value = 'La fecha «desde» no puede ser posterior a «hasta».';
      htmlReporte.value = '';
      return;
    }
    errorFiltro.value = '';
    try {
      await prepararRenderizadoReporte();
      const datos = calcularDatos(filtro.value);
      htmlReporte.value = renderizarPlantillaReporte(plantilla, datos);
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Error al generar el reporte.';
      errorFiltro.value = mensaje;
      htmlReporte.value = '';
      // eslint-disable-next-line no-console
      console.error('Error generando reporte:', error);
    }
  }

  watch(filtro, () => void actualizarReporte(), { deep: true });
  onMounted(() => void actualizarReporte());

  return {
    filtro,
    htmlReporte,
    errorFiltro,
    actualizarReporte,
  };
}

/** Reportes que sólo filtran por fechas. */
export function useReporteConFechas(
  plantilla: string,
  crearFiltroInicial: () => FiltroFechasReporte,
  calcularDatos: (filtro: FiltroFechasReporte) => object
) {
  return useReporteConFiltros(plantilla, crearFiltroInicial, calcularDatos);
}
