<script setup lang="ts">
import { ShoppingBasket } from 'lucide-vue-next';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteComprasProveedor } from '../../modulos/reportes/calcular/calcularReporteComprasProveedor';
import {
  filtrosReporteVistaPorDefecto,
  opcionesProveedoresParaReporte,
} from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useProveedoresStore } from '../../stores/proveedores';
import { useRegistroComprasStore } from '../../stores/registroCompras';

const registroComprasStore = useRegistroComprasStore();
const proveedoresStore = useProveedoresStore();
const { compras } = storeToRefs(registroComprasStore);
const { proveedores } = storeToRefs(proveedoresStore);

const opcionesProveedor = computed(() => opcionesProveedoresParaReporte(proveedores.value));

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['compras-proveedor'],
  filtrosReporteVistaPorDefecto,
  (f) => calcularReporteComprasProveedor(compras.value, f, opcionesProveedor.value)
);
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Compras por proveedor"
    descripcion="Resumen y detalle de compras. Filtrá por fechas y por proveedor."
    titulo-impresion="Reporte compras por proveedor"
    :icono="ShoppingBasket"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    mostrar-filtro-proveedor
    :opciones-proveedor="opcionesProveedor"
    @actualizar="actualizarReporte"
  />
</template>
