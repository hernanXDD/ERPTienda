<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteStockCritico } from '../../modulos/reportes/calcular/calcularReporteStockCritico';
import { filtrosReporteVistaPorDefecto } from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useCatalogoStore } from '../../stores/catalogo';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useStockStore } from '../../stores/stock';

const catalogoStore = useCatalogoStore();
const stockStore = useStockStore();
const configuracionSistemaStore = useConfiguracionSistemaStore();
const { productos, variantes } = storeToRefs(catalogoStore);
const { cantidadesPorVarianteId } = storeToRefs(stockStore);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['stock-critico'],
  filtrosReporteVistaPorDefecto,
  (f) =>
    calcularReporteStockCritico(
      productos.value,
      variantes.value,
      cantidadesPorVarianteId.value,
      (id) => catalogoStore.nombreCategoria(id),
      f,
      parametrosSistema.value.stockMinimoAlerta
    )
);
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Stock crítico"
    descripcion="Variantes agotadas o con pocas unidades. Snapshot de existencias actuales del sistema."
    titulo-impresion="Reporte stock crítico"
    :icono="AlertTriangle"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    @actualizar="actualizarReporte"
  />
</template>
