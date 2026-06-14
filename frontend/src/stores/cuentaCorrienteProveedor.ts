import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  listarMovimientosCuentaCorrienteProveedorApi,
  obtenerSaldoCuentaCorrienteProveedorApi,
  registrarPagoCuentaCorrienteProveedorApi,
} from '../servicios/cuentaCorrienteProveedor.servicio';
import type { MovimientoCuentaCorrienteProveedor } from '../tipos/cuentaCorrienteProveedor';

function compararMovimientosPorFecha(
  a: MovimientoCuentaCorrienteProveedor,
  b: MovimientoCuentaCorrienteProveedor,
): number {
  const t = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  if (t !== 0) return t;
  return a.id.localeCompare(b.id);
}

function impactoEnSaldo(m: MovimientoCuentaCorrienteProveedor): number {
  return m.tipoMovimiento === 'cargo' ? m.importe : -m.importe;
}

export interface MovimientoConSaldoProveedor extends MovimientoCuentaCorrienteProveedor {
  saldoTrasMovimiento: number;
}

export const useCuentaCorrienteProveedorStore = defineStore('cuentaCorrienteProveedor', () => {
  const movimientos = ref<MovimientoCuentaCorrienteProveedor[]>([]);
  const saldosPorProveedorId = ref<Record<string, number>>({});
  const cargando = ref(false);

  async function cargarSaldos(proveedorIds: string[]): Promise<void> {
    if (proveedorIds.length === 0) return;
    const resultados = await Promise.all(
      proveedorIds.map(async (id) => {
        const saldo = await obtenerSaldoCuentaCorrienteProveedorApi(id);
        return { id, saldo };
      }),
    );
    const mapa = { ...saldosPorProveedorId.value };
    for (const { id, saldo } of resultados) {
      mapa[id] = saldo;
    }
    saldosPorProveedorId.value = mapa;
  }

  async function cargarMovimientosProveedor(proveedorId: string): Promise<void> {
    const conSaldo = await listarMovimientosCuentaCorrienteProveedorApi(proveedorId);
    const sinEsteProveedor = movimientos.value.filter((m) => m.proveedorId !== proveedorId);
    movimientos.value = [...sinEsteProveedor, ...conSaldo].sort(compararMovimientosPorFecha);
    if (conSaldo.length > 0) {
      saldosPorProveedorId.value = {
        ...saldosPorProveedorId.value,
        [proveedorId]: conSaldo[conSaldo.length - 1].saldoTrasMovimiento,
      };
    } else {
      saldosPorProveedorId.value = { ...saldosPorProveedorId.value, [proveedorId]: 0 };
    }
  }

  async function cargarMovimientosTodos(proveedorIds: string[]): Promise<void> {
    if (cargando.value || proveedorIds.length === 0) return;
    cargando.value = true;
    try {
      await Promise.all(proveedorIds.map((id) => cargarMovimientosProveedor(id)));
    } finally {
      cargando.value = false;
    }
  }

  function saldoActualProveedor(proveedorId: string): number {
    if (saldosPorProveedorId.value[proveedorId] !== undefined) {
      return saldosPorProveedorId.value[proveedorId];
    }
    return movimientos.value
      .filter((m) => m.proveedorId === proveedorId)
      .sort(compararMovimientosPorFecha)
      .reduce((acum, m) => acum + impactoEnSaldo(m), 0);
  }

  function movimientosConSaldoProveedor(proveedorId: string): MovimientoConSaldoProveedor[] {
    const ordenados = movimientos.value
      .filter((m) => m.proveedorId === proveedorId)
      .sort(compararMovimientosPorFecha);
    let acum = 0;
    return ordenados.map((m) => {
      acum += impactoEnSaldo(m);
      return { ...m, saldoTrasMovimiento: acum };
    });
  }

  async function agregarPagoRegistrado(
    proveedorId: string,
    importe: number,
    _fecha: string,
    descripcion: string,
    formaDePagoEtiqueta: string,
    referenciaDelPagoOpcional: string | null,
  ): Promise<MovimientoCuentaCorrienteProveedor> {
    const movimiento = await registrarPagoCuentaCorrienteProveedorApi(proveedorId, {
      importe,
      descripcion: descripcion.trim() || 'Pago registrado',
      formaDePagoEtiqueta: formaDePagoEtiqueta.trim() || 'No indicada',
      referenciaDelPagoOpcional,
    });
    await cargarMovimientosProveedor(proveedorId);
    return movimiento;
  }

  const mapaSaldoProveedor = computed(() => {
    const mapa = new Map<string, number>();
    for (const [id, saldo] of Object.entries(saldosPorProveedorId.value)) {
      mapa.set(id, saldo);
    }
    for (const m of movimientos.value) {
      if (!mapa.has(m.proveedorId)) {
        mapa.set(m.proveedorId, saldoActualProveedor(m.proveedorId));
      }
    }
    return mapa;
  });

  function saldoProveedorCacheado(proveedorId: string): number {
    return mapaSaldoProveedor.value.get(proveedorId) ?? 0;
  }

  return {
    movimientos,
    saldosPorProveedorId,
    cargando,
    cargarSaldos,
    cargarMovimientosProveedor,
    cargarMovimientosTodos,
    saldoActualProveedor,
    saldoProveedorCacheado,
    movimientosConSaldoProveedor,
    agregarPagoRegistrado,
  };
});
