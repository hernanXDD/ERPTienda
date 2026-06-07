<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteVentasPeriodo } from '../../modulos/reportes/calcular/calcularReporteVentasPeriodo';
import {
  filtrosReporteVistaPorDefecto,
  opcionesClientesParaReporte,
  opcionesEstadoFacturacionParaReporte,
} from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useClientesStore } from '../../stores/clientes';
import { useVentasStore } from '../../stores/ventas';

const ventasStore = useVentasStore();
const clientesStore = useClientesStore();
const { ventas } = storeToRefs(ventasStore);
const { clientes } = storeToRefs(clientesStore);

const opcionesCliente = computed(() => opcionesClientesParaReporte(clientes.value));
const opcionesEstadoFacturacion = opcionesEstadoFacturacionParaReporte();

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['ventas-periodo'],
  filtrosReporteVistaPorDefecto,
  (f) => calcularReporteVentasPeriodo(ventas.value, f, opcionesCliente.value)
);
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Ventas por período"
    descripcion="Totales, ticket promedio y desglose por forma de pago. Filtrá por fechas, cliente y estado de facturación."
    titulo-impresion="Reporte ventas por período"
    :icono="ShoppingCart"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    mostrar-filtro-cliente
    mostrar-filtro-estado-facturacion
    :opciones-cliente="opcionesCliente"
    :opciones-estado-facturacion="opcionesEstadoFacturacion"
    @actualizar="actualizarReporte"
  />
</template>
