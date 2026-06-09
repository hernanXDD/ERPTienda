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
import {
  crearSincronizadorListaRemota,
  type OpcionesCargaLista,
} from '../utilidades/sincronizacionListaRemota';

export type DatosRegistrarCompra = DatosRegistrarCompraApi;

const sincronizador = crearSincronizadorListaRemota();

export const useRegistroComprasStore = defineStore('registroCompras', () => {
  const compras = ref<CompraRegistrada[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  async function cargar(opciones?: OpcionesCargaLista): Promise<void> {
    if (sincronizado && !opciones?.forzar) return;

    await sincronizador.serializarCarga(async () => {
      if (sincronizado && !opciones?.forzar) return;

      const generacion = sincronizador.generacionAlIniciarCarga();
      cargando.value = true;
      try {
        const lista = await listarComprasApi();
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        compras.value = lista;
        sincronizado = true;
      } finally {
        if (!sincronizador.esRespuestaObsoleta(generacion)) {
          cargando.value = false;
        }
      }
    });
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  async function registrarCompra(datos: DatosRegistrarCompra): Promise<CompraRegistrada> {
    sincronizador.marcarMutacionLocal();
    const registrada = await registrarCompraApi(datos);
    const conOperador = {
      ...registrada,
      registradoPor: crearRegistroOperadorDesdeSesion(),
    };
    compras.value = [conOperador, ...compras.value.filter((c) => c.id !== conOperador.id)];
    sincronizado = true;

    const stockStore = useStockStore();
    await Promise.all([stockStore.cargar({ forzar: true }), stockStore.cargarAuditorias(undefined, { forzar: true })]);

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
