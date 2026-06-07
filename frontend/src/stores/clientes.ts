import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  actualizarClienteApi,
  crearClienteApi,
  establecerHabilitacionClienteApi,
  listarClientesApi,
} from '../servicios/clientes.servicio';
import type { Cliente } from '../tipos/cliente';

function normalizarDocumentoClienteParaUnicidad(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      clientes.value = await listarClientesApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  function clientePorId(id: string): Cliente | undefined {
    return clientes.value.find((c) => c.id === id);
  }

  function documentoUsadoPorOtroCliente(
    documentoValor: string,
    idClienteExcluir?: string,
  ): boolean {
    const clave = normalizarDocumentoClienteParaUnicidad(documentoValor);
    if (!clave) return false;
    return clientes.value.some((c) => {
      if (idClienteExcluir !== undefined && c.id === idClienteExcluir) return false;
      return normalizarDocumentoClienteParaUnicidad(c.documento) === clave;
    });
  }

  async function setHabilitado(id: string, habilitado: boolean): Promise<void> {
    const actualizado = await establecerHabilitacionClienteApi(id, habilitado);
    const idx = clientes.value.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const copia = [...clientes.value];
    copia[idx] = actualizado;
    clientes.value = copia;
  }

  async function actualizarCliente(id: string, datos: Omit<Cliente, 'id'>): Promise<boolean> {
    if (documentoUsadoPorOtroCliente(datos.documento, id)) return false;
    const actualizado = await actualizarClienteApi(id, datos);
    const idx = clientes.value.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const copia = [...clientes.value];
    copia[idx] = actualizado;
    clientes.value = copia;
    return true;
  }

  async function agregarCliente(datos: Omit<Cliente, 'id'>): Promise<Cliente | null> {
    if (documentoUsadoPorOtroCliente(datos.documento)) return null;
    const creado = await crearClienteApi(datos);
    clientes.value = [...clientes.value, creado];
    return creado;
  }

  return {
    clientes,
    cargando,
    cargar,
    asegurarCargado,
    clientePorId,
    documentoUsadoPorOtroCliente,
    setHabilitado,
    actualizarCliente,
    agregarCliente,
  };
});
