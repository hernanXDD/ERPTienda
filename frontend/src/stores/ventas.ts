import { defineStore } from 'pinia';
import { ref } from 'vue';
import { crearSemillaVentas } from '../datos/semillaVentas';
import type { IdFormaPago, LineaVentaRegistro, VentaRegistrada } from '../tipos/venta';

function maxNumeroVentaDesdeLista(lista: VentaRegistrada[]): number {
  let max = 0;
  for (const v of lista) {
    const m = /^V-(\d+)$/.exec(v.numero);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

export interface DatosRegistrarVenta {
  clienteId: string | null;
  nombreClienteMostrar: string;
  formaPago: IdFormaPago;
  total: number;
  lineas: LineaVentaRegistro[];
  observaciones: string;
}

export const useVentasStore = defineStore('ventas', () => {
  const semilla = crearSemillaVentas();
  const ordenadas = [...semilla].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  const ventas = ref<VentaRegistrada[]>(ordenadas);
  let contadorNumero = maxNumeroVentaDesdeLista(semilla);

  function registrarVenta(datos: DatosRegistrarVenta): VentaRegistrada {
    contadorNumero += 1;
    const numero = `V-${String(contadorNumero).padStart(5, '0')}`;
    const nueva: VentaRegistrada = {
      id: crypto.randomUUID(),
      numero,
      fecha: new Date().toISOString(),
      clienteId: datos.clienteId,
      nombreClienteMostrar: datos.nombreClienteMostrar,
      formaPago: datos.formaPago,
      total: datos.total,
      lineas: datos.lineas,
      observaciones: datos.observaciones.trim(),
    };
    ventas.value = [nueva, ...ventas.value];
    return nueva;
  }

  return {
    ventas,
    registrarVenta,
  };
});
