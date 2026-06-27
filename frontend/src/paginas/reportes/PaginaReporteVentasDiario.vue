<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteVentasDiario } from '../../modulos/reportes/calcular/calcularReporteVentasDiario';
import {
  filtrosReporteVentasDiarioPorDefecto,
  opcionesClientesParaReporte,
  opcionesEstadoFacturacionParaReporte,
} from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useClientesStore } from '../../stores/clientes';
import { useFormasPagoStore } from '../../stores/formasPago';
import { useVentasStore } from '../../stores/ventas';

const ventasStore = useVentasStore();
const clientesStore = useClientesStore();
const formasPagoStore = useFormasPagoStore();
const { ventas } = storeToRefs(ventasStore);
const { clientes } = storeToRefs(clientesStore);
const { formas: formasPago } = storeToRefs(formasPagoStore);

const opcionesCliente = computed(() => opcionesClientesParaReporte(clientes.value));
const opcionesEstadoFacturacion = opcionesEstadoFacturacionParaReporte();

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['ventas-diario'],
  filtrosReporteVentasDiarioPorDefecto,
  (f) => calcularReporteVentasDiario(ventas.value, f, opcionesCliente.value, formasPago.value),
);
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Ventas del día"
    descripcion="Cierre diario con listado de operaciones, totales y desglose por forma de pago. Por defecto muestra el día de hoy."
    titulo-impresion="Reporte ventas del día"
    :icono="CalendarDays"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    mostrar-filtro-cliente
    mostrar-filtro-estado-facturacion
    :opciones-cliente="opcionesCliente"
    :opciones-estado-facturacion="opcionesEstadoFacturacion"
    @actualizar="actualizarReporte"
  />
</template>
