<script setup lang="ts">
import { Warehouse } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteStockValorizado } from '../../modulos/reportes/calcular/calcularReporteStockValorizado';
import { filtrosReporteVistaPorDefecto } from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useCatalogoStore } from '../../stores/catalogo';
import { useStockStore } from '../../stores/stock';
import { useVentasStore } from '../../stores/ventas';

const catalogoStore = useCatalogoStore();
const stockStore = useStockStore();
const ventasStore = useVentasStore();
const { productos, variantes } = storeToRefs(catalogoStore);
const { cantidadesPorVarianteId } = storeToRefs(stockStore);
const { ventas } = storeToRefs(ventasStore);

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['stock-valorizado'],
  filtrosReporteVistaPorDefecto,
  (f) =>
    calcularReporteStockValorizado(
      productos.value,
      variantes.value,
      cantidadesPorVarianteId.value,
      (id) => catalogoStore.nombreCategoria(id),
      ventas.value,
      f
    )
);
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Stock valorizado"
    descripcion="Inventario actual valorizado al precio de venta, con referencia de unidades vendidas en el período."
    titulo-impresion="Reporte stock valorizado"
    :icono="Warehouse"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    @actualizar="actualizarReporte"
  />
</template>
