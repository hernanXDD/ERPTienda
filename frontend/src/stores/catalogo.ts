import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  armarNombreLineaComercial,
  claveUnicaVariante,
} from '../modulos/catalogo/catalogoPresentacion';
import { crearSemillaCatalogo } from '../datos/semillaCatalogo';
import type { Categoria, Producto, Variante } from '../tipos/catalogo';

function nuevoId(): string {
  return crypto.randomUUID();
}

export const useCatalogoStore = defineStore('catalogo', () => {
  const semilla = crearSemillaCatalogo();
  const categorias = ref<Categoria[]>([...semilla.categorias]);
  const productos = ref<Producto[]>([...semilla.productos]);
  const variantes = ref<Variante[]>([...semilla.variantes]);

  const mapaCategoriasPorId = computed(() => {
    const m = new Map<string, Categoria>();
    for (const c of categorias.value) {
      m.set(c.id, c);
    }
    return m;
  });

  const mapaProductosPorId = computed(() => {
    const m = new Map<string, Producto>();
    for (const p of productos.value) {
      m.set(p.id, p);
    }
    return m;
  });

  const mapaVariantesPorId = computed(() => {
    const m = new Map<string, Variante>();
    for (const v of variantes.value) {
      m.set(v.id, v);
    }
    return m;
  });

  function nombreCategoria(id: string): string {
    return mapaCategoriasPorId.value.get(id)?.nombre ?? '—';
  }

  function productoPorId(id: string): Producto | undefined {
    return mapaProductosPorId.value.get(id);
  }

  function variantePorId(id: string): Variante | undefined {
    return mapaVariantesPorId.value.get(id);
  }

  function variantesDeProducto(productoId: string): Variante[] {
    return variantes.value.filter((v) => v.productoId === productoId && v.activa);
  }

  function todasVariantesDeProducto(productoId: string): Variante[] {
    return variantes.value.filter((v) => v.productoId === productoId);
  }

  function cantidadVariantesActivas(productoId: string): number {
    return variantesDeProducto(productoId).length;
  }

  function variantePorCodigoBarras(codigo: string): Variante | undefined {
    const norm = codigo.trim();
    if (!norm) return undefined;
    return variantes.value.find(
      (v) => v.activa && v.codigoBarras.trim() === norm
    );
  }

  function nombreLineaComercial(varianteId: string): string {
    const variante = variantePorId(varianteId);
    if (!variante) return 'Artículo';
    const producto = productoPorId(variante.productoId);
    if (!producto) return 'Artículo';
    return armarNombreLineaComercial(producto, variante);
  }

  function existeCombinacionVariante(
    productoId: string,
    talle: string,
    color: string,
    excluirVarianteId?: string
  ): boolean {
    const clave = claveUnicaVariante(talle, color);
    return variantes.value.some(
      (v) =>
        v.productoId === productoId &&
        v.id !== excluirVarianteId &&
        claveUnicaVariante(v.talle, v.color) === clave
    );
  }

  function agregarCategoria(c: Omit<Categoria, 'id'>): Categoria {
    const nueva: Categoria = { ...c, id: nuevoId() };
    categorias.value = [...categorias.value, nueva];
    return nueva;
  }

  function actualizarCategoria(id: string, datos: Omit<Categoria, 'id'>): void {
    const idx = categorias.value.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const copia = [...categorias.value];
    copia[idx] = { ...datos, id };
    categorias.value = copia;
  }

  function eliminarCategoria(id: string): boolean {
    const enUso = productos.value.some((p) => p.categoriaId === id);
    if (enUso) return false;
    categorias.value = categorias.value.filter((c) => c.id !== id);
    return true;
  }

  function agregarProducto(p: Omit<Producto, 'id'>): Producto {
    const nuevo: Producto = { ...p, id: nuevoId() };
    productos.value = [...productos.value, nuevo];
    return nuevo;
  }

  function actualizarProducto(id: string, datos: Omit<Producto, 'id'>): void {
    const idx = productos.value.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const copia = [...productos.value];
    copia[idx] = { ...datos, id };
    productos.value = copia;
  }

  function eliminarProducto(id: string): string[] {
    const idsVariantes = variantes.value.filter((v) => v.productoId === id).map((v) => v.id);
    productos.value = productos.value.filter((p) => p.id !== id);
    variantes.value = variantes.value.filter((v) => v.productoId !== id);
    return idsVariantes;
  }

  function agregarVariante(v: Omit<Variante, 'id'>): Variante | null {
    if (existeCombinacionVariante(v.productoId, v.talle, v.color)) return null;
    const nueva: Variante = { ...v, id: nuevoId() };
    variantes.value = [...variantes.value, nueva];
    return nueva;
  }

  function actualizarVariante(id: string, datos: Omit<Variante, 'id'>): boolean {
    if (existeCombinacionVariante(datos.productoId, datos.talle, datos.color, id)) {
      return false;
    }
    const idx = variantes.value.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    const copia = [...variantes.value];
    copia[idx] = { ...datos, id };
    variantes.value = copia;
    return true;
  }

  function eliminarVariante(id: string): boolean {
    const variante = variantePorId(id);
    if (!variante) return false;
    const activasDelProducto = variantesDeProducto(variante.productoId);
    if (activasDelProducto.length <= 1 && variante.activa) return false;
    variantes.value = variantes.value.filter((v) => v.id !== id);
    return true;
  }

  return {
    categorias,
    productos,
    variantes,
    mapaCategoriasPorId,
    mapaProductosPorId,
    mapaVariantesPorId,
    nombreCategoria,
    productoPorId,
    variantePorId,
    variantesDeProducto,
    todasVariantesDeProducto,
    cantidadVariantesActivas,
    variantePorCodigoBarras,
    nombreLineaComercial,
    existeCombinacionVariante,
    agregarCategoria,
    actualizarCategoria,
    eliminarCategoria,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    agregarVariante,
    actualizarVariante,
    eliminarVariante,
  };
});
