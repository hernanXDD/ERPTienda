import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  actualizarProveedorApi,
  crearProveedorApi,
  establecerHabilitacionProveedorApi,
  listarProveedoresApi,
} from '../servicios/proveedores.servicio';
import type { Proveedor } from '../tipos/proveedor';
import {
  crearSincronizadorListaRemota,
  type OpcionesCargaLista,
} from '../utilidades/sincronizacionListaRemota';

function normalizarDocumentoParaUnicidad(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const sincronizador = crearSincronizadorListaRemota();

export const useProveedoresStore = defineStore('proveedores', () => {
  const proveedores = ref<Proveedor[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  async function cargar(opciones?: OpcionesCargaLista): Promise<void> {
    if (sincronizado && !opciones?.forzar) return;

    await sincronizador.serializarCarga(async () => {
      if (sincronizado && !opciones?.forzar) return;

      const generacion = sincronizador.generacionAlIniciarCarga();
      cargando.value = true;
      try {
        const lista = await listarProveedoresApi();
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        proveedores.value = lista;
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

  function proveedorPorId(id: string): Proveedor | undefined {
    return proveedores.value.find((p) => p.id === id);
  }

  function documentoUsadoPorOtroProveedor(
    documentoValor: string,
    idProveedorExcluir?: string,
  ): boolean {
    const clave = normalizarDocumentoParaUnicidad(documentoValor);
    if (!clave) return false;
    return proveedores.value.some((p) => {
      if (idProveedorExcluir !== undefined && p.id === idProveedorExcluir) return false;
      return normalizarDocumentoParaUnicidad(p.documento) === clave;
    });
  }

  async function setHabilitado(id: string, habilitado: boolean): Promise<void> {
    sincronizador.marcarMutacionLocal();
    const actualizado = await establecerHabilitacionProveedorApi(id, habilitado);
    const idx = proveedores.value.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const copia = [...proveedores.value];
    copia[idx] = actualizado;
    proveedores.value = copia;
    sincronizado = true;
  }

  async function actualizarProveedor(id: string, datos: Omit<Proveedor, 'id'>): Promise<boolean> {
    if (documentoUsadoPorOtroProveedor(datos.documento, id)) return false;
    sincronizador.marcarMutacionLocal();
    const actualizado = await actualizarProveedorApi(id, datos);
    const idx = proveedores.value.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const copia = [...proveedores.value];
    copia[idx] = actualizado;
    proveedores.value = copia;
    sincronizado = true;
    return true;
  }

  async function agregarProveedor(datos: Omit<Proveedor, 'id'>): Promise<Proveedor | null> {
    if (documentoUsadoPorOtroProveedor(datos.documento)) return null;
    sincronizador.marcarMutacionLocal();
    const creado = await crearProveedorApi(datos);
    proveedores.value = [...proveedores.value.filter((p) => p.id !== creado.id), creado];
    sincronizado = true;
    return creado;
  }

  return {
    proveedores,
    cargando,
    cargar,
    asegurarCargado,
    proveedorPorId,
    documentoUsadoPorOtroProveedor,
    setHabilitado,
    actualizarProveedor,
    agregarProveedor,
  };
});
