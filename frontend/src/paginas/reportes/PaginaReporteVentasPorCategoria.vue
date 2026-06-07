<script setup lang="ts">
import { PieChart } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteVentasPorCategoria } from '../../modulos/reportes/calcular/calcularReporteVentasPorCategoria';
import { filtrosReporteVistaPorDefecto } from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useCatalogoStore } from '../../stores/catalogo';
import { useVentasStore } from '../../stores/ventas';

const catalogoStore = useCatalogoStore();
const ventasStore = useVentasStore();
const { productos, variantes } = storeToRefs(catalogoStore);
const { ventas } = storeToRefs(ventasStore);

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['ventas-por-categoria'],
  filtrosReporteVistaPorDefecto,
  (f) =>
    calcularReporteVentasPorCategoria(
      productos.value,
      variantes.value,
      ventas.value,
      (id) => catalogoStore.nombreCategoria(id),
      f
    )
);
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Ventas por categoría"
    descripcion="Facturación y unidades vendidas agrupadas por rubro del catálogo."
    titulo-impresion="Reporte ventas por categoría"
    :icono="PieChart"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    @actualizar="actualizarReporte"
  />
</template>
