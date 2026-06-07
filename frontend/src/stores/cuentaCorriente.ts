import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  listarMovimientosCuentaCorrienteApi,
  obtenerSaldoCuentaCorrienteApi,
  registrarPagoCuentaCorrienteApi,
} from '../servicios/cuentaCorriente.servicio';
import type { MovimientoCuentaCorriente } from '../tipos/cuentaCorriente';

function compararMovimientosPorFecha(a: MovimientoCuentaCorriente, b: MovimientoCuentaCorriente): number {
  const t = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  if (t !== 0) return t;
  return a.id.localeCompare(b.id);
}

function impactoEnSaldo(m: MovimientoCuentaCorriente): number {
  return m.tipoMovimiento === 'cargo' ? m.importe : -m.importe;
}

export interface MovimientoConSaldo extends MovimientoCuentaCorriente {
  saldoTrasMovimiento: number;
}

export const useCuentaCorrienteStore = defineStore('cuentaCorriente', () => {
  const movimientos = ref<MovimientoCuentaCorriente[]>([]);
  const saldosPorClienteId = ref<Record<string, number>>({});
  const cargando = ref(false);
  const clientesConMovimientosCargados = ref<Set<string>>(new Set());

  async function cargarSaldos(clienteIds: string[]): Promise<void> {
    if (clienteIds.length === 0) return;
    const resultados = await Promise.all(
      clienteIds.map(async (id) => {
        const saldo = await obtenerSaldoCuentaCorrienteApi(id);
        return { id, saldo };
      }),
    );
    const mapa = { ...saldosPorClienteId.value };
    for (const { id, saldo } of resultados) {
      mapa[id] = saldo;
    }
    saldosPorClienteId.value = mapa;
  }

  async function cargarMovimientosCliente(clienteId: string): Promise<void> {
    const conSaldo = await listarMovimientosCuentaCorrienteApi(clienteId);
    const sinEsteCliente = movimientos.value.filter((m) => m.clienteId !== clienteId);
    movimientos.value = [...sinEsteCliente, ...conSaldo].sort(compararMovimientosPorFecha);
    if (conSaldo.length > 0) {
      saldosPorClienteId.value = {
        ...saldosPorClienteId.value,
        [clienteId]: conSaldo[conSaldo.length - 1].saldoTrasMovimiento,
      };
    } else {
      saldosPorClienteId.value = { ...saldosPorClienteId.value, [clienteId]: 0 };
    }
    clientesConMovimientosCargados.value = new Set([
      ...clientesConMovimientosCargados.value,
      clienteId,
    ]);
  }

  async function cargarMovimientosTodos(clienteIds: string[]): Promise<void> {
    if (cargando.value || clienteIds.length === 0) return;
    cargando.value = true;
    try {
      await Promise.all(clienteIds.map((id) => cargarMovimientosCliente(id)));
    } finally {
      cargando.value = false;
    }
  }

  function saldoActualCliente(clienteId: string): number {
    if (saldosPorClienteId.value[clienteId] !== undefined) {
      return saldosPorClienteId.value[clienteId];
    }
    return movimientos.value
      .filter((m) => m.clienteId === clienteId)
      .sort(compararMovimientosPorFecha)
      .reduce((acum, m) => acum + impactoEnSaldo(m), 0);
  }

  function movimientosConSaldoCliente(clienteId: string): MovimientoConSaldo[] {
    const ordenados = movimientos.value.filter((m) => m.clienteId === clienteId).sort(compararMovimientosPorFecha);
    let acum = 0;
    return ordenados.map((m) => {
      acum += impactoEnSaldo(m);
      return { ...m, saldoTrasMovimiento: acum };
    });
  }

  async function agregarPagoRegistrado(
    clienteId: string,
    importe: number,
    _fecha: string,
    descripcion: string,
    formaDePagoEtiqueta: string,
    referenciaDelPagoOpcional: string | null,
  ): Promise<MovimientoCuentaCorriente> {
    const movimiento = await registrarPagoCuentaCorrienteApi(clienteId, {
      importe,
      descripcion: descripcion.trim() || 'Pago registrado',
      formaDePagoEtiqueta: formaDePagoEtiqueta.trim() || 'No indicada',
      referenciaDelPagoOpcional,
    });
    await cargarMovimientosCliente(clienteId);
    return movimiento;
  }

  const mapaSaldoCliente = computed(() => {
    const mapa = new Map<string, number>();
    for (const [id, saldo] of Object.entries(saldosPorClienteId.value)) {
      mapa.set(id, saldo);
    }
    for (const m of movimientos.value) {
      if (!mapa.has(m.clienteId)) {
        mapa.set(m.clienteId, saldoActualCliente(m.clienteId));
      }
    }
    return mapa;
  });

  function saldoClienteCacheado(clienteId: string): number {
    return mapaSaldoCliente.value.get(clienteId) ?? 0;
  }

  return {
    movimientos,
    saldosPorClienteId,
    cargando,
    cargarSaldos,
    cargarMovimientosCliente,
    cargarMovimientosTodos,
    saldoActualCliente,
    saldoClienteCacheado,
    movimientosConSaldoCliente,
    agregarPagoRegistrado,
  };
});
