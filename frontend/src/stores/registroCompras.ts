import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  listarComprasApi,
  registrarCompraApi,
  type DatosRegistrarCompraApi,
} from '../servicios/compras.servicio';
import { useStockStore } from './stock';
import type { CompraRegistrada } from '../tipos/compraRegistrada';
import { crearRegistroOperadorDesdeSesion } from '../utilidades/registroOperadorSesion';

export type DatosRegistrarCompra = DatosRegistrarCompraApi;

export const useRegistroComprasStore = defineStore('registroCompras', () => {
  const compras = ref<CompraRegistrada[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      compras.value = await listarComprasApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  async function registrarCompra(datos: DatosRegistrarCompra): Promise<CompraRegistrada> {
    const registrada = await registrarCompraApi(datos);
    const conOperador = {
      ...registrada,
      registradoPor: crearRegistroOperadorDesdeSesion(),
    };
    compras.value = [conOperador, ...compras.value.filter((c) => c.id !== conOperador.id)];
    sincronizado = true;

    const stockStore = useStockStore();
    await Promise.all([stockStore.cargar(), stockStore.cargarAuditorias()]);

    return conOperador;
  }

  return {
    compras,
    cargando,
    cargar,
    asegurarCargado,
    registrarCompra,
  };
});
