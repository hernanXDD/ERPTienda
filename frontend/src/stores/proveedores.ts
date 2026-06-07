import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  actualizarProveedorApi,
  crearProveedorApi,
  establecerHabilitacionProveedorApi,
  listarProveedoresApi,
} from '../servicios/proveedores.servicio';
import type { Proveedor } from '../tipos/proveedor';

function normalizarDocumentoParaUnicidad(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const useProveedoresStore = defineStore('proveedores', () => {
  const proveedores = ref<Proveedor[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      proveedores.value = await listarProveedoresApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
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
    const actualizado = await establecerHabilitacionProveedorApi(id, habilitado);
    const idx = proveedores.value.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const copia = [...proveedores.value];
    copia[idx] = actualizado;
    proveedores.value = copia;
  }

  async function actualizarProveedor(id: string, datos: Omit<Proveedor, 'id'>): Promise<boolean> {
    if (documentoUsadoPorOtroProveedor(datos.documento, id)) return false;
    const actualizado = await actualizarProveedorApi(id, datos);
    const idx = proveedores.value.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const copia = [...proveedores.value];
    copia[idx] = actualizado;
    proveedores.value = copia;
    return true;
  }

  async function agregarProveedor(datos: Omit<Proveedor, 'id'>): Promise<Proveedor | null> {
    if (documentoUsadoPorOtroProveedor(datos.documento)) return null;
    const creado = await crearProveedorApi(datos);
    proveedores.value = [...proveedores.value, creado];
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
