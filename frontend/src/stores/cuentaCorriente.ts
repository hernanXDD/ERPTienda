import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { crearSemillaMovimientosCuentaCorriente } from '../datos/semillaMovimientosCuentaCorriente';
import type { AuditoriaPagoCuentaCorriente, MovimientoCuentaCorriente } from '../tipos/cuentaCorriente';
import { crearCodigoPublicoReciboPagoCuentaCorriente } from '../utilidades/codigoPublicoReciboPagoCc';
import { useSesionStore } from './sesion';
function compararMovimientosPorFecha(a: MovimientoCuentaCorriente, b: MovimientoCuentaCorriente): number {
  const t = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  if (t !== 0) return t;
  return a.id.localeCompare(b.id);
}

/** Saldo deudor (positivo = el cliente debe dinero). */
function impactoEnSaldo(m: MovimientoCuentaCorriente): number {
  return m.tipoMovimiento === 'cargo' ? m.importe : -m.importe;
}

export interface MovimientoConSaldo extends MovimientoCuentaCorriente {
  saldoTrasMovimiento: number;
}

export const useCuentaCorrienteStore = defineStore('cuentaCorriente', () => {
  const movimientos = ref<MovimientoCuentaCorriente[]>([...crearSemillaMovimientosCuentaCorriente()]);

  function saldoActualCliente(clienteId: string): number {
    return movimientos.value
      .filter((m) => m.clienteId === clienteId)
      .sort(compararMovimientosPorFecha)
      .reduce((acum, m) => acum + impactoEnSaldo(m), 0);
  }

  /**
   * Lista cronológica con saldo acumulado real tras cada movimiento (según historial completo).
   */
  function movimientosConSaldoCliente(clienteId: string): MovimientoConSaldo[] {
    const ordenados = movimientos.value.filter((m) => m.clienteId === clienteId).sort(compararMovimientosPorFecha);
    let acum = 0;
    return ordenados.map((m) => {
      acum += impactoEnSaldo(m);
      return { ...m, saldoTrasMovimiento: acum };
    });
  }

  /**
   * Registra un pago con datos para recibo (código público, operador, forma de cobro).
   * @returns El movimiento creado para UI e impresión provisional de recibo.
   */
  function agregarPagoRegistrado(
    clienteId: string,
    importe: number,
    fecha: string,
    descripcion: string,
    formaDePagoEtiqueta: string,
    referenciaDelPagoOpcional: string | null
  ): MovimientoCuentaCorriente {
    const sesion = useSesionStore();
    const usuario = sesion.usuario;
    const etiquetaUsuario = usuario?.nombreUsuario?.trim() || 'Operador sin sesión identificada';
    const idUsuario = usuario?.id ?? null;

    const codigoPublicoRecibo = crearCodigoPublicoReciboPagoCuentaCorriente();
    const forma = formaDePagoEtiqueta.trim() || 'No indicada';
    const auditoriaPago: AuditoriaPagoCuentaCorriente = {
      marcaTiempoUtcRegistroCliente: new Date().toISOString(),
      codigoPublicoRecibo,
      etiquetaUsuarioRegistrante: etiquetaUsuario,
      idUsuarioSesionRegistrante: idUsuario,
      canalCapturaDocumentado: 'interfaz_web_erp',
      formaDePagoEtiqueta: forma,
      referenciaDelPagoOpcional: referenciaDelPagoOpcional?.trim() || null,
    };

    const registro: MovimientoCuentaCorriente = {
      id: crypto.randomUUID(),
      clienteId,
      fecha,
      tipoMovimiento: 'pagoRegistrado',
      importe,
      descripcion: descripcion.trim() || 'Pago registrado',
      auditoriaPago,
    };
    movimientos.value = [...movimientos.value, registro];
    return registro;
  }
  /** Útil cuando se conecten ventas a CC: mismo criterio de saldo que los cargos de semilla. */
  function agregarCargoVenta(clienteId: string, importe: number, fecha: string, descripcion: string): void {
    const registro: MovimientoCuentaCorriente = {
      id: crypto.randomUUID(),
      clienteId,
      fecha,
      tipoMovimiento: 'cargo',
      importe,
      descripcion: descripcion.trim() || 'Cargo en cuenta corriente',
    };
    movimientos.value = [...movimientos.value, registro];
  }

  const mapaSaldoCliente = computed(() => {
    const ids = [...new Set(movimientos.value.map((m) => m.clienteId))];
    const mapa = new Map<string, number>();
    for (const id of ids) {
      mapa.set(id, saldoActualCliente(id));
    }
    return mapa;
  });

  function saldoClienteCacheado(clienteId: string): number {
    return mapaSaldoCliente.value.get(clienteId) ?? 0;
  }

  return {
    movimientos,
    saldoActualCliente,
    saldoClienteCacheado,
    movimientosConSaldoCliente,
    agregarPagoRegistrado,
    agregarCargoVenta,
  };
});
