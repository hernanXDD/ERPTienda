import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { crearSemillaCatalogo } from '../datos/semillaCatalogo';
import type { Categoria, Producto } from '../tipos/catalogo';

function nuevoId(): string {
  return crypto.randomUUID();
}

export const useCatalogoStore = defineStore('catalogo', () => {
  const semilla = crearSemillaCatalogo();
  const categorias = ref<Categoria[]>([...semilla.categorias]);
  const productos = ref<Producto[]>([...semilla.productos]);

  const mapaCategoriasPorId = computed(() => {
    const m = new Map<string, Categoria>();
    for (const c of categorias.value) {
      m.set(c.id, c);
    }
    return m;
  });

  function nombreCategoria(id: string): string {
    return mapaCategoriasPorId.value.get(id)?.nombre ?? '—';
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

  function eliminarProducto(id: string): void {
    productos.value = productos.value.filter((p) => p.id !== id);
  }

  return {
    categorias,
    productos,
    mapaCategoriasPorId,
    nombreCategoria,
    agregarCategoria,
    actualizarCategoria,
    eliminarCategoria,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
  };
});
