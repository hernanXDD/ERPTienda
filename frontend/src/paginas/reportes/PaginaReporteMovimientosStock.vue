<script setup lang="ts">
import { ScrollText } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { calcularReporteMovimientosStock } from '../../modulos/reportes/calcular/calcularReporteMovimientosStock';
import { filtrosReporteVistaPorDefecto } from '../../modulos/reportes/filtroEntidadReporte';
import { esRangoFechasValido } from '../../modulos/reportes/filtroFechasReporte';
import { renderizarPlantillaReporte } from '../../modulos/reportes/motorEtaReportes';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useStockStore } from '../../stores/stock';

const stockStore = useStockStore();
const { auditorias } = storeToRefs(stockStore);

const filtro = ref(filtrosReporteVistaPorDefecto());
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
    await stockStore.cargarAuditorias({
      fechaDesde: filtro.value.fechaDesde,
      fechaHasta: filtro.value.fechaHasta,
    });
    const datos = calcularReporteMovimientosStock(auditorias.value, filtro.value);
    htmlReporte.value = renderizarPlantillaReporte(plantillasReportes['movimientos-stock'], datos);
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error al generar el reporte.';
    errorFiltro.value = mensaje;
    htmlReporte.value = '';
    // eslint-disable-next-line no-console
    console.error('Error generando reporte:', error);
  }
}

watch(filtro, () => void actualizarReporte(), { deep: true });

onMounted(async () => {
  await stockStore.asegurarCargado();
  await actualizarReporte();
});
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Movimientos de stock"
    descripcion="Entradas, salidas y ajustes por ventas, compras y conteos de inventario en el período."
    titulo-impresion="Reporte movimientos de stock"
    :icono="ScrollText"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    @actualizar="actualizarReporte"
  />
</template>
