<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteProductosMasVendidos } from '../../modulos/reportes/calcular/calcularReporteProductosMasVendidos';
import { filtrosReporteVistaPorDefecto } from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useCatalogoStore } from '../../stores/catalogo';
import { useVentasStore } from '../../stores/ventas';

const catalogoStore = useCatalogoStore();
const ventasStore = useVentasStore();
const { productos, variantes } = storeToRefs(catalogoStore);
const { ventas } = storeToRefs(ventasStore);

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['productos-mas-vendidos'],
  filtrosReporteVistaPorDefecto,
  (f) =>
    calcularReporteProductosMasVendidos(
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
    titulo="Productos más vendidos"
    descripcion="Ranking de variantes por unidades e importe facturado en el período seleccionado."
    titulo-impresion="Reporte productos más vendidos"
    :icono="TrendingUp"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    @actualizar="actualizarReporte"
  />
</template>
