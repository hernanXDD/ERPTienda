import { defineStore } from 'pinia';
import { ref } from 'vue';
import { crearSemillaClientes } from '../datos/semillaClientes';
import type { Cliente } from '../tipos/cliente';

/** Clave para comparar documentos sin puntos ni guiones. */
function normalizarDocumentoClienteParaUnicidad(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([...crearSemillaClientes()]);

  function clientePorId(id: string): Cliente | undefined {
    return clientes.value.find((c) => c.id === id);
  }

  /** @param idClienteExcluir En edición, el registro actual no cuenta como duplicado. */
  function documentoUsadoPorOtroCliente(
    documentoValor: string,
    idClienteExcluir?: string
  ): boolean {
    const clave = normalizarDocumentoClienteParaUnicidad(documentoValor);
    if (!clave) return false;
    return clientes.value.some((c) => {
      if (idClienteExcluir !== undefined && c.id === idClienteExcluir) return false;
      return normalizarDocumentoClienteParaUnicidad(c.documento) === clave;
    });
  }

  function setHabilitado(id: string, habilitado: boolean): void {
    const idx = clientes.value.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const copia = [...clientes.value];
    copia[idx] = { ...copia[idx], habilitado };
    clientes.value = copia;
  }

  function actualizarCliente(id: string, datos: Omit<Cliente, 'id'>): boolean {
    if (documentoUsadoPorOtroCliente(datos.documento, id)) return false;
    const idx = clientes.value.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const copia = [...clientes.value];
    copia[idx] = { ...datos, id };
    clientes.value = copia;
    return true;
  }

  function agregarCliente(cliente: Cliente): boolean {
    if (clientes.value.some((c) => c.id === cliente.id)) return false;
    if (documentoUsadoPorOtroCliente(cliente.documento)) return false;
    clientes.value = [...clientes.value, cliente];
    return true;
  }

  return {
    clientes,
    clientePorId,
    documentoUsadoPorOtroCliente,
    setHabilitado,
    actualizarCliente,
    agregarCliente,
  };
});
