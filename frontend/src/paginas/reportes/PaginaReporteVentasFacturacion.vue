<script setup lang="ts">
import { FileSpreadsheet } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ContenedorVistaReporteExcel from '../../componentes/reportes/ContenedorVistaReporteExcel.vue';
import { calcularReporteVentasFacturacion } from '../../modulos/reportes/calcular/calcularReporteVentasFacturacion';
import { exportarExcelVentasFacturacion } from '../../modulos/reportes/exportacion/exportarExcelVentasFacturacion';
import {
  filtrosReporteVistaPorDefecto,
  opcionesClientesParaReporte,
  opcionesFiltroFacturacionVentasFacturacion,
} from '../../modulos/reportes/filtroEntidadReporte';
import { esRangoFechasValido } from '../../modulos/reportes/filtroFechasReporte';
import { useClientesStore } from '../../stores/clientes';
import { useVentasStore } from '../../stores/ventas';
import { notificarError } from '../../utilidades/notificacion';

const ventasStore = useVentasStore();
const clientesStore = useClientesStore();
const { ventas } = storeToRefs(ventasStore);
const { clientes } = storeToRefs(clientesStore);

const filtro = ref(filtrosReporteVistaPorDefecto());
const errorFiltro = ref('');
const exportandoExcel = ref(false);
const refContenedor = ref<InstanceType<typeof ContenedorVistaReporteExcel> | null>(null);

const opcionesCliente = computed(() => opcionesClientesParaReporte(clientes.value));
const opcionesEstadoFacturacion = opcionesFiltroFacturacionVentasFacturacion();

const datosReporte = computed(() => {
  if (!esRangoFechasValido(filtro.value)) {
    return calcularReporteVentasFacturacion([], [], filtro.value, opcionesCliente.value);
  }
  return calcularReporteVentasFacturacion(
    ventas.value,
    clientes.value,
    filtro.value,
    opcionesCliente.value,
  );
});

const resumenReporte = computed(() => {
  if (datosReporte.value.sinVentas) return '';
  const partes = [
    `${datosReporte.value.cantidadOperaciones} ventas`,
    `Total ${datosReporte.value.totalImporte.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
    datosReporte.value.rangoLegible,
  ];
  if (datosReporte.value.filtroEstadoFacturacionLegible) {
    partes.push(datosReporte.value.filtroEstadoFacturacionLegible);
  }
  return partes.join(' · ');
});

function validarFiltro(): void {
  if (!esRangoFechasValido(filtro.value)) {
    errorFiltro.value = 'La fecha «desde» no puede ser posterior a «hasta».';
    return;
  }
  errorFiltro.value = '';
}

watch(filtro, validarFiltro, { deep: true });

onMounted(async () => {
  await Promise.all([ventasStore.asegurarVentasCargadas(), clientesStore.asegurarCargado()]);
  validarFiltro();
});

async function exportarExcel(): Promise<void> {
  if (exportandoExcel.value || datosReporte.value.sinVentas || errorFiltro.value) return;

  exportandoExcel.value = true;
  try {
    await exportarExcelVentasFacturacion(
      datosReporte.value,
      filtro.value.fechaDesde,
      filtro.value.fechaHasta,
    );
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo generar el archivo Excel.';
    refContenedor.value?.registrarErrorExportacion(mensaje);
    notificarError(mensaje);
  } finally {
    exportandoExcel.value = false;
  }
}
</script>

<template>
  <ContenedorVistaReporteExcel
    ref="refContenedor"
    v-model="filtro"
    titulo="Ventas para facturación"
    descripcion="Exportá las ventas del período en Excel para emitir comprobantes fiscales. Incluye datos del cliente, importe y estado de facturación."
    :icono="FileSpreadsheet"
    :error-filtro="errorFiltro"
    :hay-datos="!datosReporte.sinVentas && !errorFiltro"
    :resumen="resumenReporte"
    :exportando="exportandoExcel"
    mostrar-filtro-cliente
    mostrar-filtro-estado-facturacion
    :opciones-cliente="opcionesCliente"
    :opciones-estado-facturacion="opcionesEstadoFacturacion"
    @actualizar="validarFiltro"
    @exportar="exportarExcel"
  >
    <div class="rep-tabla-previa-envoltorio">
      <table class="rep-tabla-previa">
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>N° venta</th>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Condición IVA</th>
            <th class="der">Importe</th>
            <th>Estado</th>
            <th>N° factura</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in datosReporte.filas" :key="fila.numeroVenta">
            <td>{{ fila.fechaHora }}</td>
            <td class="mono">{{ fila.numeroVenta }}</td>
            <td>{{ fila.cliente }}</td>
            <td class="mono">{{ fila.documento || '—' }}</td>
            <td>{{ fila.condicionIva }}</td>
            <td class="der mono">
              {{ fila.importeNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              <span
                class="rep-estado-fact"
                :class="
                  fila.estadoFacturacion === 'Facturada'
                    ? 'rep-estado-fact--ok'
                    : 'rep-estado-fact--pend'
                "
              >
                {{ fila.estadoFacturacion }}
              </span>
            </td>
            <td class="mono">{{ fila.facturacion || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </ContenedorVistaReporteExcel>
</template>

<style scoped>
.rep-tabla-previa-envoltorio {
  overflow: auto;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
}

.rep-tabla-previa {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.rep-tabla-previa th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.55rem 0.65rem;
  text-align: left;
  background: linear-gradient(180deg, #1e3a5f 0%, #152a45 100%);
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.rep-tabla-previa td {
  padding: 0.45rem 0.65rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.rep-tabla-previa tbody tr:nth-child(even) td {
  background: #f8fafc;
}

.rep-tabla-previa .der {
  text-align: right;
}

.rep-tabla-previa .mono {
  font-variant-numeric: tabular-nums;
}

.rep-estado-fact {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.rep-estado-fact--pend {
  background: #fef3c7;
  color: #92400e;
}

.rep-estado-fact--ok {
  background: #d1fae5;
  color: #065f46;
}
</style>
