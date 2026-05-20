import { defineStore } from 'pinia';
import { ref } from 'vue';
import { crearSemillaComprasRegistro } from '../datos/semillaComprasRegistro';
import type { CompraRegistrada, IdCondicionCompra, LineaCompraRegistro } from '../tipos/compraRegistrada';
import { crearRegistroOperadorDesdeSesion } from '../utilidades/registroOperadorSesion';

function maximoNumeroCompraEnLista(lista: CompraRegistrada[]): number {
  let maximo = 0;
  for (const c of lista) {
    const coincidencia = /^C-(\d+)$/.exec(c.numero);
    if (coincidencia) maximo = Math.max(maximo, parseInt(coincidencia[1], 10));
  }
  return maximo;
}

export interface DatosRegistrarCompra {
  proveedorId: string;
  nombreProveedorMostrar: string;
  condicionCompra: IdCondicionCompra;
  total: number;
  lineas: LineaCompraRegistro[];
  observaciones: string;
}

export const useRegistroComprasStore = defineStore('registroCompras', () => {
  const semilla = crearSemillaComprasRegistro();
  const ordenadas = [...semilla].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  const compras = ref<CompraRegistrada[]>(ordenadas);
  let contadorNumeroCompra = maximoNumeroCompraEnLista(semilla);

  function registrarCompra(datos: DatosRegistrarCompra): CompraRegistrada {
    contadorNumeroCompra += 1;
    const numero = `C-${String(contadorNumeroCompra).padStart(5, '0')}`;
    const nueva: CompraRegistrada = {
      id: crypto.randomUUID(),
      numero,
      fecha: new Date().toISOString(),
      proveedorId: datos.proveedorId,
      nombreProveedorMostrar: datos.nombreProveedorMostrar.trim(),
      condicionCompra: datos.condicionCompra,
      total: datos.total,
      lineas: datos.lineas,
      observaciones: datos.observaciones.trim(),
      registradoPor: crearRegistroOperadorDesdeSesion(),
    };
    compras.value = [nueva, ...compras.value];
    return nueva;
  }

  return {
    compras,
    registrarCompra,
  };
});
