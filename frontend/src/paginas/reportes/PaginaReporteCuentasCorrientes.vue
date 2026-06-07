<script setup lang="ts">
import { Wallet } from 'lucide-vue-next';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteCuentasCorrientes } from '../../modulos/reportes/calcular/calcularReporteCuentasCorrientes';
import {
  filtrosReporteVistaPorDefecto,
  ID_CONSUMIDOR_FINAL_REPORTE,
  opcionesClientesParaReporte,
} from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useClientesStore } from '../../stores/clientes';
import { useCuentaCorrienteStore } from '../../stores/cuentaCorriente';

const clientesStore = useClientesStore();
const cuentaCorrienteStore = useCuentaCorrienteStore();
const { clientes } = storeToRefs(clientesStore);
const { movimientos } = storeToRefs(cuentaCorrienteStore);

const opcionesCliente = computed(() =>
  opcionesClientesParaReporte(clientes.value).filter((o) => o.id !== ID_CONSUMIDOR_FINAL_REPORTE)
);

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['cuentas-corrientes'],
  filtrosReporteVistaPorDefecto,
  (f) => calcularReporteCuentasCorrientes(clientes.value, movimientos.value, f, opcionesCliente.value)
);

onMounted(() => {
  void (async () => {
    await clientesStore.asegurarCargado();
    const ids = clientesStore.clientes
      .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
      .map((c) => c.id);
    await cuentaCorrienteStore.cargarMovimientosTodos(ids);
  })();
});
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Cuentas corrientes"
    descripcion="Saldos y movimientos del período por cliente. Filtrá por fechas y por cliente."
    titulo-impresion="Reporte cuentas corrientes"
    :icono="Wallet"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    mostrar-filtro-cliente
    :opciones-cliente="opcionesCliente"
    @actualizar="actualizarReporte"
  />
</template>
