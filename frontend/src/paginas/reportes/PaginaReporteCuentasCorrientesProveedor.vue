<script setup lang="ts">
import { Landmark } from 'lucide-vue-next';
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporte from '../../componentes/reportes/ContenedorVistaReporte.vue';
import { useReporteConFiltros } from '../../composables/useReporteConFechas';
import { calcularReporteCuentasCorrientesProveedor } from '../../modulos/reportes/calcular/calcularReporteCuentasCorrientesProveedor';
import {
  filtrosReporteVistaPorDefecto,
  opcionesProveedoresParaReporte,
} from '../../modulos/reportes/filtroEntidadReporte';
import { plantillasReportes } from '../../modulos/reportes/plantillasReportes';
import { useCuentaCorrienteProveedorStore } from '../../stores/cuentaCorrienteProveedor';
import { useProveedoresStore } from '../../stores/proveedores';

const proveedoresStore = useProveedoresStore();
const cuentaCorrienteProveedorStore = useCuentaCorrienteProveedorStore();
const { proveedores } = storeToRefs(proveedoresStore);
const { movimientos } = storeToRefs(cuentaCorrienteProveedorStore);

const opcionesProveedor = computed(() => opcionesProveedoresParaReporte(proveedores.value));

const { filtro, htmlReporte, errorFiltro, actualizarReporte } = useReporteConFiltros(
  plantillasReportes['cuentas-corrientes-proveedor'],
  filtrosReporteVistaPorDefecto,
  (f) =>
    calcularReporteCuentasCorrientesProveedor(
      proveedores.value,
      movimientos.value,
      f,
      opcionesProveedor.value,
    ),
);

onMounted(() => {
  void (async () => {
    await proveedoresStore.asegurarCargado();
    const ids = proveedoresStore.proveedores
      .filter((p) => p.habilitado && p.comprasCreditoHabilitadas)
      .map((p) => p.id);
    await cuentaCorrienteProveedorStore.cargarMovimientosTodos(ids);
  })();
});
</script>

<template>
  <ContenedorVistaReporte
    v-model="filtro"
    titulo="Cuentas corrientes proveedores"
    descripcion="Saldos y movimientos del período por proveedor. Filtrá por fechas y por proveedor."
    titulo-impresion="Reporte cuentas corrientes proveedores"
    :icono="Landmark"
    :html-reporte="htmlReporte"
    :error-filtro="errorFiltro"
    mostrar-filtro-proveedor
    :opciones-proveedor="opcionesProveedor"
    @actualizar="actualizarReporte"
  />
</template>
