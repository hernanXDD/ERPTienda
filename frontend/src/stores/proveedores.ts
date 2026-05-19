import { defineStore } from 'pinia';
import { ref } from 'vue';
import { crearSemillaProveedores } from '../datos/semillaProveedores';
import type { Proveedor } from '../tipos/proveedor';

function normalizarDocumentoParaUnicidad(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const useProveedoresStore = defineStore('proveedores', () => {
  const proveedores = ref<Proveedor[]>([...crearSemillaProveedores()]);

  function proveedorPorId(id: string): Proveedor | undefined {
    return proveedores.value.find((p) => p.id === id);
  }

  function documentoUsadoPorOtroProveedor(
    documentoValor: string,
    idProveedorExcluir?: string
  ): boolean {
    const clave = normalizarDocumentoParaUnicidad(documentoValor);
    if (!clave) return false;
    return proveedores.value.some((p) => {
      if (idProveedorExcluir !== undefined && p.id === idProveedorExcluir) return false;
      return normalizarDocumentoParaUnicidad(p.documento) === clave;
    });
  }

  function setHabilitado(id: string, habilitado: boolean): void {
    const idx = proveedores.value.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const copia = [...proveedores.value];
    copia[idx] = { ...copia[idx], habilitado };
    proveedores.value = copia;
  }

  function actualizarProveedor(id: string, datos: Omit<Proveedor, 'id'>): boolean {
    if (documentoUsadoPorOtroProveedor(datos.documento, id)) return false;
    const idx = proveedores.value.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const copia = [...proveedores.value];
    copia[idx] = { ...datos, id };
    proveedores.value = copia;
    return true;
  }

  function agregarProveedor(proveedor: Proveedor): boolean {
    if (proveedores.value.some((p) => p.id === proveedor.id)) return false;
    if (documentoUsadoPorOtroProveedor(proveedor.documento)) return false;
    proveedores.value = [...proveedores.value, proveedor];
    return true;
  }

  return {
    proveedores,
    proveedorPorId,
    documentoUsadoPorOtroProveedor,
    setHabilitado,
    actualizarProveedor,
    agregarProveedor,
  };
});
