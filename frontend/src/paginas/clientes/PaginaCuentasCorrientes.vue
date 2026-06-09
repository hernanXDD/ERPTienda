<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useClientesStore } from '../../stores/clientes';
import { useCuentaCorrienteStore, type MovimientoConSaldo } from '../../stores/cuentaCorriente';
import { exportarPdfCuentaCorrienteCliente } from '../../modulos/clientes/exportarPdfCuentaCorrienteCliente';
import { exportarReciboPagoCuentaCorrientePdf } from '../../modulos/clientes/impresionReciboPagoCuentaCorriente';
import { notificarError } from '../../utilidades/notificacion';
import { usePermisosOperador } from '../../composables/usePermisosOperador';
import { opcionesFormaPagoRegistroCuentaCorriente } from '../../modulos/clientes/formasPagoRegistroCuentaCorriente';
import type { Cliente } from '../../tipos/cliente';
import { formatearFechaYHora, obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('clientes-cuentas-corrientes');
const { tienePermiso } = usePermisosOperador();
const puedeGestionarCuentaCorriente = computed(() => tienePermiso('puedeGestionarCuentaCorriente'));

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const clientesStore = useClientesStore();
const cuentaCorrienteStore = useCuentaCorrienteStore();
const { clientes } = storeToRefs(clientesStore);
const { movimientos } = storeToRefs(cuentaCorrienteStore);

const refDialogoMovimientos = ref<HTMLDialogElement | null>(null);
const refCuadroRegistrarPago = ref<HTMLDialogElement | null>(null);
const clienteModal = ref<Cliente | null>(null);
const fechaFiltroDesde = ref('');
const fechaFiltroHasta = ref('');
const exportandoPdfCuenta = ref(false);

const busquedaNombre = ref('');
/** '' = todos; con-deuda = saldo deudor > 0; sin-deuda = saldo <= 0 */
const filtroDeuda = ref<'' | 'con-deuda' | 'sin-deuda'>('');

const opcionesFiltroDeuda = [
  { valor: '' as const, etiqueta: 'Todas las cuentas' },
  { valor: 'con-deuda' as const, etiqueta: 'Con deuda pendiente' },
  { valor: 'sin-deuda' as const, etiqueta: 'Sin deuda pendiente' },
];

const refImportePago = ref<HTMLInputElement | null>(null);

const fechaPago = ref('');
const importePagoTexto = ref('');
const descripcionPago = ref('');
const formaPagoEtiqueta = ref(opcionesFormaPagoRegistroCuentaCorriente[0]?.etiqueta ?? '');
const referenciaPagoTexto = ref('');
const errorFormularioPago = ref('');

function estaMovimientoEnRangoFecha(m: MovimientoConSaldo): boolean {
  const comparable = obtenerDiaComparableDesdeValor(m.fecha);
  if (fechaFiltroDesde.value && comparable < fechaFiltroDesde.value) return false;
  if (fechaFiltroHasta.value && comparable > fechaFiltroHasta.value) return false;
  return true;
}

const cuentasHabilitadas = computed(() =>
  [...clientes.value]
    .filter((c) => c.habilitado && c.cuentaCorrienteHabilitada)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
);

function clienteTieneDeudaPendiente(clienteId: string): boolean {
  return cuentaCorrienteStore.saldoClienteCacheado(clienteId) > 0;
}

const cuentasFiltradas = computed(() => {
  const texto = busquedaNombre.value.trim().toLowerCase();
  return cuentasHabilitadas.value.filter((c) => {
    if (texto) {
      const agregado = `${c.nombre} ${c.documento}`.toLowerCase();
      if (!agregado.includes(texto)) return false;
    }
    if (filtroDeuda.value === 'con-deuda' && !clienteTieneDeudaPendiente(c.id)) return false;
    if (filtroDeuda.value === 'sin-deuda' && clienteTieneDeudaPendiente(c.id)) return false;
    return true;
  });
});

const hayFiltrosListadoActivos = computed(
  () => Boolean(busquedaNombre.value.trim() || filtroDeuda.value),
);

function limpiarFiltrosListado(): void {
  busquedaNombre.value = '';
  filtroDeuda.value = '';
}

function creditoDisponible(cliente: Cliente): number {
  const saldo = cuentaCorrienteStore.saldoClienteCacheado(cliente.id);
  return cliente.limiteCompraCuentaCorriente - saldo;
}

const movimientosFiltradosModal = computed(() => {
  const id = clienteModal.value?.id;
  if (!id) return [];
  return cuentaCorrienteStore.movimientosConSaldoCliente(id).filter(estaMovimientoEnRangoFecha);
});

const saldoDeudorModal = computed(() => {
  const id = clienteModal.value?.id;
  if (!id) return 0;
  return Math.max(0, cuentaCorrienteStore.saldoClienteCacheado(id));
});

const cantidadCuentasCorriente = computed(() => cuentasHabilitadas.value.length);

const cantidadCuentasVisibles = computed(() => cuentasFiltradas.value.length);

const saldoTotalCartera = computed(() =>
  cuentasFiltradas.value.reduce((acumulado, clienteActual) => {
    return acumulado + cuentaCorrienteStore.saldoClienteCacheado(clienteActual.id);
  }, 0)
);

const limiteTotalCartera = computed(() =>
  cuentasFiltradas.value.reduce(
    (acumulado, clienteActual) => acumulado + clienteActual.limiteCompraCuentaCorriente,
    0
  )
);

function etiquetaTipoMovimiento(tipo: MovimientoConSaldo['tipoMovimiento']): string {
  return tipo === 'cargo' ? 'Cargo' : 'Pago';
}

function cerrarCuadroRegistrarPago(): void {
  refCuadroRegistrarPago.value?.close();
}

function limpiarFormularioRegistrarPago(): void {
  importePagoTexto.value = '';
  descripcionPago.value = '';
  formaPagoEtiqueta.value = opcionesFormaPagoRegistroCuentaCorriente[0]?.etiqueta ?? '';
  referenciaPagoTexto.value = '';
  errorFormularioPago.value = '';
}

function alCerrarCuadroRegistrarPago(): void {
  limpiarFormularioRegistrarPago();
}

function abrirMovimientosCliente(c: Cliente): void {
  clienteModal.value = c;
  fechaFiltroDesde.value = '';
  fechaFiltroHasta.value = '';
  cerrarCuadroRegistrarPago();
  limpiarFormularioRegistrarPago();
  refDialogoMovimientos.value?.showModal();
}

function alCerrarDialogoMovimientos(): void {
  cerrarCuadroRegistrarPago();
  clienteModal.value = null;
  limpiarFormularioRegistrarPago();
}

function cerrarDialogoMovimientos(): void {
  refDialogoMovimientos.value?.close();
}

function abrirFormularioPago(): void {
  if (!clienteModal.value) return;
  errorFormularioPago.value = '';
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  fechaPago.value = `${y}-${m}-${d}`;
  importePagoTexto.value = '';
  descripcionPago.value = '';
  formaPagoEtiqueta.value = opcionesFormaPagoRegistroCuentaCorriente[0]?.etiqueta ?? '';
  referenciaPagoTexto.value = '';
  refCuadroRegistrarPago.value?.showModal();
  requestAnimationFrame(() => refImportePago.value?.focus());
}

function normalizarImporteArgentino(texto: string): number {
  const limpio = texto.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(limpio);
  return Number.isFinite(n) ? n : Number.NaN;
}

function confirmarRegistroPago(): void {
  const c = clienteModal.value;
  if (!c) return;
  const importe = normalizarImporteArgentino(importePagoTexto.value);
  if (!Number.isFinite(importe) || importe <= 0) {
    errorFormularioPago.value = 'Ingresá un importe válido mayor a cero.';
    return;
  }
  if (!fechaPago.value) {
    errorFormularioPago.value = 'Elegí la fecha del pago.';
    return;
  }
  const formaTrim = formaPagoEtiqueta.value.trim();
  if (!formaTrim) {
    errorFormularioPago.value = 'Elegí la forma de pago.';
    return;
  }
  const fechaIso = `${fechaPago.value}T12:00:00`;
  void cuentaCorrienteStore
    .agregarPagoRegistrado(
      c.id,
      importe,
      fechaIso,
      descripcionPago.value.trim(),
      formaTrim,
      referenciaPagoTexto.value.trim() || null,
    )
    .then(async (movimientoCreado) => {
      cerrarCuadroRegistrarPago();
      try {
        await exportarReciboPagoCuentaCorrientePdf({
          cliente: { nombre: c.nombre, documento: c.documento },
          movimiento: movimientoCreado,
        });
      } catch (error: unknown) {
        notificarError(
          error instanceof Error ? error.message : 'No se pudo exportar el recibo de cobro.',
        );
      }
    })
    .catch((error: unknown) => {
      errorFormularioPago.value = mensajeErrorHttp(error, 'No se pudo registrar el pago.');
    });
}

onMounted(() => {
  void (async () => {
    await clientesStore.asegurarCargado();
    const ids = clientesStore.clientes
      .filter((cl) => cl.habilitado && cl.cuentaCorrienteHabilitada)
      .map((cl) => cl.id);
    await cuentaCorrienteStore.cargarMovimientosTodos(ids);
  })();
});

async function imprimirReciboPagoDesdeHistorial(movimiento: MovimientoConSaldo): Promise<void> {
  const c = clienteModal.value;
  if (!c || movimiento.tipoMovimiento !== 'pagoRegistrado') return;
  try {
    await exportarReciboPagoCuentaCorrientePdf({
      cliente: { nombre: c.nombre, documento: c.documento },
      movimiento,
    });
  } catch (error: unknown) {
    notificarError(
      error instanceof Error ? error.message : 'No se pudo exportar el recibo de cobro.',
    );
  }
}

async function imprimirCuentaCliente(): Promise<void> {
  const c = clienteModal.value;
  if (!c || exportandoPdfCuenta.value) return;

  exportandoPdfCuenta.value = true;
  try {
    await exportarPdfCuentaCorrienteCliente({
      cliente: c,
      clientes: clientes.value,
      movimientos: movimientos.value,
      fechaDesde: fechaFiltroDesde.value || undefined,
      fechaHasta: fechaFiltroHasta.value || undefined,
    });
  } catch (error: unknown) {
    notificarError(
      error instanceof Error ? error.message : 'No se pudo exportar el reporte de cuenta corriente.',
    );
  } finally {
    exportandoPdfCuenta.value = false;
  }
}
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-cc">
    <div class="pg-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <p class="pg-eyebrow">Clientes · Cuentas corrientes</p>
          <h1 id="titulo-cc" class="pg-titulo">Cuentas corrientes</h1>
          <p class="pg-sub">{{ descripcionPagina }}</p>
        </div>
        <div class="pg-kpis" role="group" aria-label="Resumen de la cartera en cuenta corriente">
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Cuentas activas</span>
            <span class="pg-kpi-valor pg-mono">{{ cantidadCuentasCorriente }}</span>
          </div>
          <div class="pg-kpi">
            <span class="pg-kpi-etiq">Límite combinado CC</span>
            <span class="pg-kpi-valor pg-mono">{{ formatoPeso.format(limiteTotalCartera) }}</span>
          </div>
          <div class="pg-kpi pg-kpi--peligro">
            <span class="pg-kpi-etiq">Saldo total cartera</span>
            <span class="pg-kpi-valor pg-mono">{{ formatoPeso.format(saldoTotalCartera) }}</span>
          </div>
        </div>
      </header>

      <div class="pg-barra" role="search" aria-label="Filtrar cartera de cuentas corrientes">
        <div class="pg-barra-col pg-barra-col--busq">
          <label class="pg-filtro-bl" for="pg-filtro-nombre">
            <span class="pg-filtro-etiq">Buscar por nombre</span>
            <input
              id="pg-filtro-nombre"
              v-model="busquedaNombre"
              type="search"
              class="pg-filtro-inp"
              placeholder="Nombre o documento del cliente…"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--filtro">
          <label class="pg-filtro-bl" for="pg-filtro-deuda">
            <span class="pg-filtro-etiq">Estado de deuda</span>
            <select id="pg-filtro-deuda" v-model="filtroDeuda" class="pg-filtro-inp pg-filtro-sel">
              <option v-for="op in opcionesFiltroDeuda" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </label>
        </div>

        <div class="pg-barra-col pg-barra-col--reinicio">
          <div class="pg-filtro-bl">
            <span class="pg-filtro-etiq">Reinicio</span>
            <button
              type="button"
              class="pg-btn-reset-filtros"
              :disabled="!hayFiltrosListadoActivos"
              @click="limpiarFiltrosListado"
            >
              <RefreshCw :size="16" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <p v-if="hayFiltrosListadoActivos" class="pg-resumen" role="status">
        Mostrando <strong>{{ cantidadCuentasVisibles }}</strong> de
        {{ cantidadCuentasCorriente }}
        {{ cantidadCuentasCorriente === 1 ? 'cuenta' : 'cuentas' }} en la cartera.
      </p>

      <section class="pg-tabla-cuerpo" aria-labelledby="cc-listado-cartera-tit">
        <header class="pg-tabla-cab">
          <h2 id="cc-listado-cartera-tit" class="pg-tabla-h2 cc-modal-seclab">
            Cartera habilitada
          </h2>
          <span class="pg-tabla-meta pg-mono">
            {{ cantidadCuentasVisibles }}
            {{ cantidadCuentasVisibles === 1 ? 'cliente visible' : 'clientes visibles' }}
          </span>
        </header>

        <div class="pg-tabla-scroll" role="region" aria-label="Cuentas corrientes por cliente">
          <table class="pg-tabla pg-tabla--estado">
            <thead>
              <tr>
                <th scope="col" class="cc-col-cliente">Cliente</th>
                <th scope="col" class="cc-col-documento">Documento</th>
                <th scope="col" class="pg-der cc-col-monto-lista">Límite CC</th>
                <th scope="col" class="pg-der cc-col-monto-lista">Saldo actual</th>
                <th scope="col" class="pg-der cc-col-monto-lista">Disponible</th>
                <th scope="col" class="pg-acc cc-col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cuentasFiltradas" :key="c.id">
                <td class="cc-cel-cliente">{{ c.nombre }}</td>
                <td class="pg-mono cc-col-documento">{{ c.documento }}</td>
                <td class="pg-der pg-mono cc-col-monto-lista">{{ formatoPeso.format(c.limiteCompraCuentaCorriente) }}</td>
                <td class="pg-der pg-mono cc-col-monto-lista">{{ formatoPeso.format(cuentaCorrienteStore.saldoClienteCacheado(c.id)) }}</td>
                <td class="pg-der pg-mono cc-col-monto-lista cc-cel-disponible">
                  {{ formatoPeso.format(creditoDisponible(c)) }}
                </td>
                <td class="pg-acc cc-col-acciones">
                  <button
                    type="button"
                    class="pg-btn pg-btn--lg"
                    @click="abrirMovimientosCliente(c)"
                  >
                    Movimientos de cuenta
                  </button>
                </td>
              </tr>
              <tr v-if="cuentasFiltradas.length === 0">
                <td colspan="6" class="pg-vacio">
                  <template v-if="cuentasHabilitadas.length === 0">
                    No hay clientes con cuenta corriente habilitada y habilitados para operar.
                  </template>
                  <template v-else>
                    Ningún cliente coincide con los filtros elegidos. Probá otro nombre o cambiá el
                    estado de deuda.
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <dialog
      ref="refDialogoMovimientos"
      class="cc-modal"
      aria-labelledby="cc-dlg-mov-tit"
      @close="alCerrarDialogoMovimientos"
    >
      <div v-if="clienteModal" class="cc-modal-panel" @click.stop>
        <header class="cc-modal-cab">
          <div class="cc-modal-cab-bloque">
            <p class="cc-modal-eyebrow">Cuenta corriente</p>
            <h2 id="cc-dlg-mov-tit" class="cc-modal-tit">Movimientos de cuenta</h2>
            <p class="cc-modal-sub">
              <span class="cc-modal-sub-nombre">{{ clienteModal.nombre }}</span>
              <span class="cc-modal-sub-sep" aria-hidden="true">·</span>
              <span class="cc-mono">{{ clienteModal.documento }}</span>
            </p>
          </div>
          <div class="cc-modal-kpis" role="group" aria-label="Resumen de saldos">
            <div class="pg-kpi">
              <span class="pg-kpi-etiq">Saldo actual</span>
              <span class="pg-kpi-valor pg-mono">{{
                formatoPeso.format(cuentaCorrienteStore.saldoClienteCacheado(clienteModal.id))
              }}</span>
            </div>
            <div class="pg-kpi pg-kpi--acento">
              <span class="pg-kpi-etiq">Disponible para compras</span>
              <span class="pg-kpi-valor pg-mono">{{ formatoPeso.format(creditoDisponible(clienteModal)) }}</span>
            </div>
          </div>
          <button type="button" class="cc-modal-x" aria-label="Cerrar" @click="cerrarDialogoMovimientos"></button>
        </header>

        <div class="cc-modal-barra">
          <div class="cc-modal-filtros" role="search" aria-label="Filtrar por período">
            <span class="cc-modal-seclab">Período</span>
            <label class="cc-fecha-lab">
              <span>Desde</span>
              <input v-model="fechaFiltroDesde" type="date" class="cc-fecha-inp" autocomplete="off" />
            </label>
            <label class="cc-fecha-lab">
              <span>Hasta</span>
              <input v-model="fechaFiltroHasta" type="date" class="cc-fecha-inp" autocomplete="off" />
            </label>
          </div>
          <div class="cc-modal-toolbar">
            <button
              v-if="puedeGestionarCuentaCorriente"
              type="button"
              class="cc-btn accent cc-btn--lg"
              @click="abrirFormularioPago"
            >
              Registrar pago
            </button>
            <button
              type="button"
              class="cc-btn imprimir cc-btn--lg"
              :disabled="exportandoPdfCuenta"
              aria-label="Exportar reporte PDF de la cuenta corriente del cliente"
              @click="imprimirCuentaCliente"
            >
              {{ exportandoPdfCuenta ? 'Generando PDF…' : 'Imprimir reporte' }}
            </button>
          </div>
        </div>

        <section class="cc-modal-tabla-cuerpo" aria-labelledby="cc-dlg-hist-tit">
          <header class="cc-modal-tabla-cab">
            <h3 id="cc-dlg-hist-tit" class="cc-modal-seclab cc-modal-tabla-titulo">Historial</h3>
            <span class="cc-modal-tabla-meta cc-mono"
              >{{ movimientosFiltradosModal.length }}
              {{
                movimientosFiltradosModal.length === 1 ? 'movimiento' : 'movimientos'
              }}</span
            >
          </header>
          <div class="cc-modal-tabla-scroll" role="region" aria-label="Listado de movimientos">
            <table class="cc-tabla cc-tabla-estado">
              <thead>
                <tr>
                  <th scope="col" class="cc-col-fecha">Fecha / hora</th>
                  <th scope="col" class="cc-col-tipo">Tipo</th>
                  <th scope="col">Descripción</th>
                  <th scope="col" class="cc-col-recibo">Recibo</th>
                  <th scope="col" class="cc-der cc-col-monto">Debe</th>
                  <th scope="col" class="cc-der cc-col-monto">Haber</th>
                  <th scope="col" class="cc-der cc-col-saldo">Saldo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in movimientosFiltradosModal" :key="m.id">
                  <td class="cc-mono cc-col-fecha">{{ formatearFechaYHora(m.fecha) }}</td>
                  <td class="cc-col-tipo">
                    <span
                      class="cc-pill"
                      :class="m.tipoMovimiento === 'cargo' ? 'cc-pill--cargo' : 'cc-pill--pago'"
                    >
                      {{ etiquetaTipoMovimiento(m.tipoMovimiento) }}
                    </span>
                  </td>
                  <td class="cc-cel-desc">{{ m.descripcion }}</td>
                  <td class="cc-col-recibo">
                    <template v-if="m.tipoMovimiento === 'pagoRegistrado'">
                      <div class="cc-cel-recibo">
                        <span
                          v-if="m.auditoriaPago?.codigoPublicoRecibo"
                          class="cc-recibo-cod cc-mono"
                          :title="m.auditoriaPago.codigoPublicoRecibo"
                        >
                          {{ m.auditoriaPago.codigoPublicoRecibo }}
                        </span>
                        <button
                          type="button"
                          class="cc-btn-imprimir-recibo"
                          :aria-label="`Imprimir recibo del pago del ${formatearFechaYHora(m.fecha)}`"
                          @click="imprimirReciboPagoDesdeHistorial(m)"
                        >
                          Imprimir recibo
                        </button>
                      </div>
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="cc-der cc-mono cc-col-monto">
                    {{ m.tipoMovimiento === 'cargo' ? formatoPeso.format(m.importe) : '—' }}
                  </td>
                  <td class="cc-der cc-mono cc-col-monto">
                    {{ m.tipoMovimiento === 'pagoRegistrado' ? formatoPeso.format(m.importe) : '—' }}
                  </td>
                  <td class="cc-der cc-mono cc-col-saldo">{{ formatoPeso.format(m.saldoTrasMovimiento) }}</td>
                </tr>
                <tr v-if="movimientosFiltradosModal.length === 0">
                  <td colspan="7" class="cc-vacio-inner">No hay movimientos en el rango de fechas elegido.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </dialog>

    <dialog
      ref="refCuadroRegistrarPago"
      class="cc-modal cc-modal-registro-pago"
      aria-labelledby="cc-dlg-reg-pago-tit"
      aria-modal="true"
      @close="alCerrarCuadroRegistrarPago"
    >
      <div v-if="clienteModal" class="cc-reg-pago-panel" @click.stop>
        <header class="cc-reg-pago-cab">
          <div class="cc-reg-pago-cab-bloque-pr">
            <p class="cc-modal-eyebrow">Registrar ingreso</p>
            <h2 id="cc-dlg-reg-pago-tit" class="cc-modal-tit">Pago · cuenta corriente</h2>
            <p class="cc-modal-sub">
              <span class="cc-modal-sub-nombre">{{ clienteModal.nombre }}</span>
              <span class="cc-modal-sub-sep" aria-hidden="true">·</span>
              <span class="cc-mono">{{ clienteModal.documento }}</span>
            </p>
          </div>
          <button type="button" class="cc-modal-x" aria-label="Cerrar" @click="cerrarCuadroRegistrarPago"></button>
        </header>

        <div v-if="clienteModal" class="cc-reg-pago-resumen" aria-label="Resumen de la cuenta">
          <div class="cc-reg-pago-resumen-item">
            <span class="cc-reg-pago-resumen-etiq">Saldo deudor</span>
            <span
              class="cc-reg-pago-resumen-val cc-mono"
              :class="{ 'cc-reg-pago-resumen-val--deuda': saldoDeudorModal > 0 }"
            >
              {{ formatoPeso.format(saldoDeudorModal) }}
            </span>
          </div>
          <div class="cc-reg-pago-resumen-item">
            <span class="cc-reg-pago-resumen-etiq">Límite CC</span>
            <span class="cc-reg-pago-resumen-val cc-mono">{{
              formatoPeso.format(clienteModal.limiteCompraCuentaCorriente)
            }}</span>
          </div>
          <div class="cc-reg-pago-resumen-item cc-reg-pago-resumen-item--acento">
            <span class="cc-reg-pago-resumen-etiq">Disponible para compras</span>
            <span class="cc-reg-pago-resumen-val cc-mono">{{
              formatoPeso.format(creditoDisponible(clienteModal))
            }}</span>
          </div>
        </div>

        <form class="cc-reg-pago-form" @submit.prevent="confirmarRegistroPago">
          <p v-if="errorFormularioPago" class="cc-form-error" role="alert">{{ errorFormularioPago }}</p>

          <div role="group" aria-labelledby="cc-reg-pago-leyenda-dat" class="cc-reg-datos-recuadro">
            <h3 id="cc-reg-pago-leyenda-dat" class="cc-reg-seccion-tit">Datos del pago</h3>
            <div class="cc-form-grid">
              <label class="cc-inp-wrap cc-inp-span2">
                <span class="cc-inp-lab">Fecha del pago (contable)</span>
                <input v-model="fechaPago" type="date" class="cc-inp" required autocomplete="off" />
              </label>

              <div class="cc-reg-fila-importe cc-inp-span2">
                <label class="cc-inp-wrap">
                  <span class="cc-inp-lab">Importe a registrar</span>
                  <input
                    ref="refImportePago"
                    v-model="importePagoTexto"
                    type="text"
                    class="cc-inp cc-inp--importe"
                    inputmode="decimal"
                    placeholder="Ej. 45000 o 45.000"
                    autocomplete="off"
                  />
                </label>
                <div class="cc-reg-saldo-deudor" role="status" aria-live="polite">
                  <span class="cc-reg-saldo-deudor-etiq">Saldo deudor total</span>
                  <span
                    class="cc-reg-saldo-deudor-val cc-mono"
                    :class="{ 'cc-reg-saldo-deudor-val--deuda': saldoDeudorModal > 0 }"
                  >
                    {{ formatoPeso.format(saldoDeudorModal) }}
                  </span>
                  <p class="cc-reg-saldo-deudor-ayuda">Deuda pendiente antes de aplicar este pago.</p>
                </div>
              </div>

              <label class="cc-inp-wrap">
                <span class="cc-inp-lab">Forma de pago</span>
                <select v-model="formaPagoEtiqueta" class="cc-inp" required autocomplete="off">
                  <option
                    v-for="opcionFormaDePago in opcionesFormaPagoRegistroCuentaCorriente"
                    :key="opcionFormaDePago.etiqueta"
                    :value="opcionFormaDePago.etiqueta"
                  >
                    {{ opcionFormaDePago.etiqueta }}
                  </option>
                </select>
              </label>
              <label class="cc-inp-wrap">
                <span class="cc-inp-lab">Referencia del pago (opcional)</span>
                <input
                  v-model="referenciaPagoTexto"
                  type="text"
                  class="cc-inp"
                  maxlength="120"
                  placeholder="Ej. Nº de cheque, cupón POS, transferencia…"
                  autocomplete="off"
                />
              </label>
              <label class="cc-inp-wrap cc-inp-span2">
                <span class="cc-inp-lab">Concepto (visible al cliente)</span>
                <input
                  v-model="descripcionPago"
                  type="text"
                  class="cc-inp"
                  maxlength="200"
                  placeholder="Ej. Transferencia CBU ****1234"
                  autocomplete="off"
                />
              </label>
            </div>
          </div>

          <div class="cc-reg-pago-acciones">
            <button type="button" class="cc-btn ghost cc-btn--lg" @click="cerrarCuadroRegistrarPago">Cancelar</button>
            <button type="submit" class="cc-btn accent cc-btn--lg">Registrar pago y ver recibo</button>
          </div>
        </form>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.pg-wrap {
  --pg-reserva-vertical-vista: clamp(13.75rem, 26dvh, 20rem);
}

.cc-col-cliente {
  min-width: 10rem;
}

.cc-col-documento {
  white-space: nowrap;
  width: 1%;
}

.cc-col-monto-lista {
  min-width: 6.85rem;
  width: 11%;
}

.cc-col-acciones {
  width: 1%;
  min-width: 10.75rem;
}

.cc-cel-cliente {
  color: var(--color-texto);
  font-weight: 500;
}

.cc-cel-disponible {
  font-weight: 600;
  color: var(--color-exito);
}

.cc-vacio--principal {
  text-align: center;
}

.cc-der {
  text-align: right;
}

.cc-acc {
  text-align: right;
  white-space: nowrap;
}

.cc-mono {
  font-variant-numeric: tabular-nums;
}

.cc-btn {
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  padding: 0.38rem 0.65rem;
  font-size: 0.8rem;
}

.cc-btn:hover {
  border-color: var(--color-acento-borde);
}

.cc-btn.mov {
  white-space: nowrap;
}

.cc-btn.accent {
  background: linear-gradient(
    165deg,
    var(--color-acento-intenso),
    var(--color-acento)
  );
  border-color: var(--color-acento-borde);
  color: var(--color-texto-sobre-acento);
}

.cc-btn.accent:hover {
  filter: brightness(1.06);
}

.cc-btn.ghost {
  background: transparent;
}

.cc-btn--lg {
  padding: 0.52rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.cc-btn.imprimir {
  border: 1px solid var(--color-borde);
  background: rgba(241, 245, 249, 0.06);
}

.cc-btn.imprimir:hover {
  border-color: var(--color-acento-borde);
  background: rgba(124, 140, 240, 0.1);
}

/* Modal cuenta corriente: ocupa mayor parte del viewport */
.cc-modal {
  border: none;
  padding: 0;
  width: min(97vw, 1320px);
  max-width: none;
  max-height: calc(100vh - 1rem);
  height: min(94vh, 940px);
  border-radius: 14px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45), 0 0 1px rgba(124, 140, 240, 0.2);
}

.cc-modal::backdrop {
  background: rgba(5, 8, 16, 0.78);
  backdrop-filter: blur(3px);
}

.cc-modal-panel {
  padding: 0;
  height: 100%;
  max-height: inherit;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Cabecera */
.cc-modal-cab {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem clamp(1rem, 3vw, 1.65rem);
  padding-top: 1.35rem;
  padding-bottom: 1.15rem;
  border-bottom: 1px solid var(--color-borde);
  background: linear-gradient(
    165deg,
    rgba(7, 11, 20, 0.98) 0%,
    rgba(21, 29, 46, 0.92) 45%,
    rgba(21, 29, 46, 0.55) 100%
  );
}

@media (width >= 720px) {
  .cc-modal-cab {
    display: grid;
    grid-template-columns: 1fr auto min-content;
    grid-template-rows: auto;
    align-items: start;
    gap: 0.85rem 1.25rem;
    padding-top: 1.25rem;
  }

  .cc-modal-kpis {
    grid-column: 2;
    grid-row: 1;
  }

  .cc-modal-x {
    grid-column: 3;
    grid-row: 1;
    align-self: start;
  }
}

.cc-modal-cab-bloque {
  min-width: 0;
  padding-right: 2.75rem;
}

@media (width >= 720px) {
  .cc-modal-cab-bloque {
    grid-column: 1;
    padding-right: 0;
  }
}

.cc-modal-x {
  position: absolute;
  top: 1rem;
  right: clamp(1rem, 3vw, 1.65rem);
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: rgba(12, 18, 34, 0.6);
  color: var(--color-texto-apagado);
  display: grid;
  place-items: center;
}

@media (width >= 720px) {
  .cc-modal-x {
    position: relative;
    top: auto;
    right: auto;
  }
}

.cc-modal-x::before {
  content: '';
  width: 0.8rem;
  height: 0.8rem;
  background:
    linear-gradient(to top left, transparent calc(50% - 1px), currentColor 50%, transparent calc(50% + 1px)),
    linear-gradient(to top right, transparent calc(50% - 1px), currentColor 50%, transparent calc(50% + 1px));
}

.cc-modal-x:hover {
  color: var(--color-texto);
  border-color: var(--color-acento-borde);
  background: var(--color-fondo-cabecera);
}

.cc-modal-eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-acento);
}

.cc-modal-tit {
  margin: 0;
  font-size: clamp(1.15rem, 2.2vw, 1.4rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.cc-modal-sub {
  margin: 0.45rem 0 0;
  font-size: 0.88rem;
  color: var(--color-texto-apagado);
  line-height: 1.4;
}

.cc-modal-sub-nombre {
  color: var(--color-texto-suave);
}

.cc-modal-sub-sep {
  margin: 0 0.35rem;
}

.cc-modal-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  min-width: 0;
  width: 100%;
}

@media (width >= 720px) {
  .cc-modal-kpis {
    width: auto;
    min-width: min(340px, 36vw);
  }
}

.cc-kpi {
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  padding: 0.65rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.cc-kpi--acento {
  border-color: var(--color-acento-borde);
  background: linear-gradient(
    155deg,
    rgba(91, 110, 230, 0.18),
    rgba(124, 140, 240, 0.08)
  );
}

.cc-kpi-etiq {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.cc-kpi--acento .cc-kpi-etiq {
  color: var(--color-texto-suave);
}

.cc-kpi-valor {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-texto);
  letter-spacing: -0.02em;
}

.cc-kpi--acento .cc-kpi-valor {
  color: var(--color-acento-hover);
}

/* Barra filtros / acciones */
.cc-modal-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.85rem 1.25rem;
  padding: 0.9rem clamp(1rem, 3vw, 1.65rem);
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.cc-modal-filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.65rem 1rem;
}

.cc-modal-seclab {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
  margin-right: 0.35rem;
  align-self: center;
}

.cc-modal-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  margin-left: auto;
}

.cc-fecha-lab {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cc-fecha-lab > span {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-texto-suave);
}

.cc-fecha-inp {
  font: inherit;
  font-variant-numeric: tabular-nums;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  padding: 0.42rem 0.58rem;
  min-height: 2.35rem;
}

.cc-form-pago {
  margin: 0 clamp(1rem, 3vw, 1.65rem);
  margin-top: 1rem;
  border: 1px solid var(--color-acento-borde);
  border-radius: 12px;
  background: linear-gradient(
    165deg,
    rgba(124, 140, 240, 0.12),
    rgba(124, 140, 240, 0.04)
  );
  padding: 1rem 1.05rem;
  flex-shrink: 0;
}

.cc-form-error {
  margin: 0 0 0.65rem;
  font-size: 0.875rem;
  color: var(--color-peligro);
}

.cc-form-grid {
  display: grid;
  gap: 0.65rem 1rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

@media (width < 520px) {
  .cc-form-grid {
    grid-template-columns: 1fr;
  }
}

@container cuadroRegistrarPago (max-width: 36rem) {
  .cc-form-grid {
    grid-template-columns: 1fr;
  }

  .cc-reg-fila-importe {
    grid-template-columns: 1fr;
  }

  .cc-reg-pago-resumen {
    grid-template-columns: 1fr;
  }
}

.cc-reg-pago-panel .cc-inp-wrap {
  min-width: 0;
}

.cc-reg-pago-panel .cc-inp {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.cc-inp-span2 {
  grid-column: 1 / -1;
}

.cc-inp-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.cc-inp-lab {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-texto-suave);
}

.cc-inp {
  font: inherit;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  padding: 0.48rem 0.62rem;
  min-height: 2.35rem;
}

.cc-form-acc {
  margin-top: 0.75rem;
}

/* Área tabla flexible */
.cc-modal-tabla-cuerpo {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 clamp(1rem, 3vw, 1.65rem);
  padding-top: 0.95rem;
  padding-bottom: 1.25rem;
}

.cc-modal-tabla-cab {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
  flex-shrink: 0;
}

.cc-modal-tabla-titulo {
  margin: 0;
}

.cc-modal-tabla-meta {
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
}

.cc-modal-tabla-scroll {
  flex: 1;
  min-height: 140px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
}

.cc-tabla.cc-tabla-estado {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.cc-tabla.cc-tabla-estado thead {
  box-shadow: 0 1px 0 var(--color-borde);
}

.cc-tabla.cc-tabla-estado thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.7rem clamp(0.65rem, 1.8vw, 1rem);
  font-weight: 600;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-suave);
  background: var(--color-fondo-cabecera);
  border-bottom: 1px solid var(--color-borde);
  backdrop-filter: blur(4px);
}

.cc-tabla.cc-tabla-estado td {
  padding: 0.62rem clamp(0.65rem, 1.8vw, 1rem);
  border-bottom: 1px solid rgba(42, 58, 84, 0.55);
  vertical-align: middle;
}

.cc-tabla.cc-tabla-estado tbody tr:nth-child(even) {
  background: rgba(124, 140, 240, 0.03);
}

.cc-tabla.cc-tabla-estado tbody tr:hover {
  background: rgba(124, 140, 240, 0.07);
}

.cc-col-fecha {
  width: 1%;
  white-space: nowrap;
}

.cc-col-tipo {
  width: 1%;
  white-space: nowrap;
}

.cc-col-monto {
  width: 10.5%;
  min-width: 6.75rem;
}

.cc-col-saldo {
  width: 11%;
  min-width: 7.25rem;
  font-weight: 600;
  color: var(--color-texto-suave);
}

.cc-cel-desc {
  max-width: 18rem;
  color: var(--color-texto);
}

@media (width >= 900px) {
  .cc-cel-desc {
    max-width: none;
  }
}

.cc-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.cc-pill--cargo {
  background: rgba(251, 113, 133, 0.14);
  color: var(--color-peligro);
  border: 1px solid rgba(251, 113, 133, 0.35);
}

.cc-pill--pago {
  background: rgba(74, 222, 128, 0.12);
  color: var(--color-exito);
  border: 1px solid rgba(74, 222, 128, 0.32);
}

.cc-vacio-inner {
  text-align: center;
  color: var(--color-texto-apagado);
  font-size: 0.89rem;
  padding: 2.5rem 1rem !important;
  background: transparent !important;
}

/* Segundo modal: registrar pago */
.cc-modal-registro-pago.cc-modal {
  box-sizing: border-box;
  width: min(40rem, calc(100vw - 1.25rem));
  height: auto;
  max-height: min(92dvh, 52rem);
  overflow: hidden;
  margin-inline: auto;
}

.cc-reg-pago-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  container-name: cuadroRegistrarPago;
  container-type: inline-size;
  min-width: 0;
  max-height: min(92dvh, 52rem);
  overflow-x: hidden;
  overflow-y: auto;
}

.cc-reg-pago-cab {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
  padding: 1.15rem clamp(1rem, 3vw, 1.5rem) 0.9rem;
  border-bottom: 1px solid var(--color-borde);
  background: linear-gradient(
    165deg,
    rgba(7, 11, 20, 0.98) 0%,
    rgba(21, 29, 46, 0.88) 50%,
    rgba(21, 29, 46, 0.45) 100%
  );
}

.cc-reg-pago-cab .cc-modal-x {
  position: absolute;
  top: 0.95rem;
  right: clamp(0.85rem, 2.5vw, 1.35rem);
}

.cc-reg-pago-cab-bloque-pr {
  min-width: 0;
  flex: 1;
  padding-right: 2.85rem;
}

.cc-reg-pago-resumen {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  padding: 0.75rem clamp(1rem, 3vw, 1.5rem);
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
}

.cc-reg-pago-resumen-item {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
  padding: 0.62rem 0.72rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
  background: rgba(12, 18, 34, 0.35);
}

.cc-reg-pago-resumen-item--acento {
  border-color: rgba(74, 222, 128, 0.28);
  background: linear-gradient(162deg, rgba(74, 222, 128, 0.1), rgba(12, 18, 34, 0.35));
}

.cc-reg-pago-resumen-etiq {
  font-size: 0.64rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.cc-reg-pago-resumen-val {
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--color-texto);
}

.cc-reg-pago-resumen-val--deuda {
  color: var(--color-peligro);
}

.cc-reg-fila-importe {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 0.65rem 1rem;
  align-items: stretch;
}

.cc-reg-saldo-deudor {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.22rem;
  min-width: 0;
  padding: 0.72rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(251, 113, 133, 0.28);
  background: linear-gradient(
    165deg,
    rgba(251, 113, 133, 0.12),
    rgba(12, 18, 34, 0.42)
  );
}

.cc-reg-saldo-deudor-etiq {
  font-size: 0.64rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-texto-apagado);
}

.cc-reg-saldo-deudor-val {
  font-size: 1.18rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--color-texto-suave);
}

.cc-reg-saldo-deudor-val--deuda {
  color: var(--color-peligro);
}

.cc-reg-saldo-deudor-ayuda {
  margin: 0.12rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-texto-apagado);
}

.cc-inp--importe {
  font-size: 1.02rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cc-reg-pago-form {
  min-width: 0;
  padding: 0.8rem clamp(1rem, 3vw, 1.5rem) 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cc-reg-seccion-tit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 0.69rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--color-texto-suave);
}

.cc-reg-seccion-tit::before,
.cc-reg-seccion-tit::after {
  content: '';
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-borde) 12%,
    var(--color-borde) 88%,
    transparent
  );
}

.cc-reg-datos-recuadro {
  margin: 0;
  min-width: 0;
  padding: 0.85rem clamp(0.85rem, 2.2vw, 1rem) 1rem;
  border-radius: 12px;
  border: 1px solid rgba(124, 140, 240, 0.22);
  background: linear-gradient(
    168deg,
    rgba(124, 140, 240, 0.08),
    rgba(12, 18, 34, 0.35)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.cc-reg-pago-panel .cc-form-grid {
  gap: 0.55rem 1rem;
}

.cc-inp:is(select) {
  cursor: pointer;
  appearance: auto;
}

.cc-reg-pago-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: flex-end;
  padding-top: 0.85rem;
  margin-top: 0.05rem;
  border-top: 1px solid var(--color-borde);
  padding-inline: 0;
  padding-bottom: 0;
}

.cc-reg-pago-panel .cc-inp:focus {
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 3px rgba(124, 140, 240, 0.18);
  outline: none;
}

.cc-reg-pago-panel .cc-inp::placeholder {
  color: var(--color-texto-suave);
  opacity: 0.88;
}

.cc-reg-pago-panel select.cc-inp option {
  background: var(--color-fondo-elevado);
  color: var(--color-texto);
}

@media (width < 480px) {
  .cc-reg-pago-resumen {
    grid-template-columns: 1fr;
  }

  .cc-reg-fila-importe {
    grid-template-columns: 1fr;
  }

  .cc-reg-pago-acciones {
    flex-direction: column-reverse;
  }

  .cc-reg-pago-acciones .cc-btn {
    width: 100%;
    justify-content: center;
  }
}

.cc-col-recibo {
  width: 1%;
  min-width: 7.5rem;
  max-width: 11.5rem;
  vertical-align: middle;
  font-size: 0.72rem;
  color: var(--color-texto-suave);
}

.cc-cel-recibo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.cc-recibo-cod {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.68rem;
  color: var(--color-texto-apagado);
}

.cc-btn-imprimir-recibo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.28rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(124, 140, 240, 0.35);
  background: rgba(124, 140, 240, 0.1);
  color: var(--color-acento-hover);
  font: inherit;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.cc-btn-imprimir-recibo:hover {
  border-color: rgba(124, 140, 240, 0.55);
  background: rgba(124, 140, 240, 0.18);
}

.cc-btn-imprimir-recibo:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
</style>
