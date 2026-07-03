import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  actualizarCategoriaApi,
  crearCategoriaApi,
  eliminarCategoriaApi,
  listarCategoriasApi,
} from '../servicios/categorias.servicio';
import {
  actualizarProductoApi,
  actualizarVarianteApi,
  crearProductoApi,
  crearVarianteApi,
  eliminarProductoApi,
  eliminarVarianteApi,
  importarStockInicialApi,
  listarProductosApi,
  listarVariantesApi,
  type LineaImportarStockInicialApi,
  type ResultadoImportarStockInicialApi,
} from '../servicios/catalogo.servicio';
import {
  armarNombreLineaComercial,
  claveUnicaVariante,
} from '../modulos/catalogo/catalogoPresentacion';
import type { Categoria, Producto, Variante } from '../tipos/catalogo';
import {
  crearSincronizadorListaRemota,
  type OpcionesCargaLista,
} from '../utilidades/sincronizacionListaRemota';

const sincronizador = crearSincronizadorListaRemota();

export const useCatalogoStore = defineStore('catalogo', () => {
  const categorias = ref<Categoria[]>([]);
  const productos = ref<Producto[]>([]);
  const variantes = ref<Variante[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

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

  async function cargar(opciones?: OpcionesCargaLista): Promise<void> {
    if (sincronizado && !opciones?.forzar) return;

    await sincronizador.serializarCarga(async () => {
      if (sincronizado && !opciones?.forzar) return;

      const generacion = sincronizador.generacionAlIniciarCarga();
      cargando.value = true;
      try {
        const [cats, prods] = await Promise.all([
          listarCategoriasApi(),
          listarProductosApi(),
        ]);
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        const vars = await listarVariantesApi();
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        categorias.value = cats;
        productos.value = prods;
        variantes.value = vars;
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
    return variantes.value.find((v) => v.activa && v.codigoBarras.trim() === norm);
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
    excluirVarianteId?: string,
  ): boolean {
    const clave = claveUnicaVariante(talle, color);
    return variantes.value.some(
      (v) =>
        v.productoId === productoId &&
        v.id !== excluirVarianteId &&
        claveUnicaVariante(v.talle, v.color) === clave,
    );
  }

  async function agregarCategoria(c: Omit<Categoria, 'id'>): Promise<Categoria> {
    sincronizador.marcarMutacionLocal();
    const nueva = await crearCategoriaApi(c);
    categorias.value = [...categorias.value.filter((x) => x.id !== nueva.id), nueva];
    sincronizado = true;
    return nueva;
  }

  async function actualizarCategoria(id: string, datos: Omit<Categoria, 'id'>): Promise<void> {
    sincronizador.marcarMutacionLocal();
    const actualizada = await actualizarCategoriaApi(id, datos);
    const idx = categorias.value.findIndex((x) => x.id === id);
    if (idx === -1) {
      categorias.value = [...categorias.value, actualizada];
      return;
    }
    const copia = [...categorias.value];
    copia[idx] = actualizada;
    categorias.value = copia;
    sincronizado = true;
  }

  async function eliminarCategoria(id: string): Promise<boolean> {
    const enUso = productos.value.some((p) => p.categoriaId === id);
    if (enUso) return false;
    sincronizador.marcarMutacionLocal();
    await eliminarCategoriaApi(id);
    categorias.value = categorias.value.filter((c) => c.id !== id);
    sincronizado = true;
    return true;
  }

  async function agregarProducto(p: Omit<Producto, 'id'>): Promise<Producto> {
    sincronizador.marcarMutacionLocal();
    const nuevo = await crearProductoApi(p);
    productos.value = [...productos.value.filter((x) => x.id !== nuevo.id), nuevo];
    sincronizado = true;
    return nuevo;
  }

  async function actualizarProducto(id: string, datos: Omit<Producto, 'id'>): Promise<void> {
    sincronizador.marcarMutacionLocal();
    const actualizado = await actualizarProductoApi(id, datos);
    const idx = productos.value.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const copia = [...productos.value];
    copia[idx] = actualizado;
    productos.value = copia;
    sincronizado = true;
  }

  async function eliminarProducto(id: string): Promise<string[]> {
    const idsVariantes = variantes.value.filter((v) => v.productoId === id).map((v) => v.id);
    sincronizador.marcarMutacionLocal();
    await eliminarProductoApi(id);
    productos.value = productos.value.filter((p) => p.id !== id);
    variantes.value = variantes.value.filter((v) => v.productoId !== id);
    sincronizado = true;
    return idsVariantes;
  }

  async function agregarVariante(v: Omit<Variante, 'id'>): Promise<Variante | null> {
    if (existeCombinacionVariante(v.productoId, v.talle, v.color)) return null;
    sincronizador.marcarMutacionLocal();
    const nueva = await crearVarianteApi(v);
    variantes.value = [...variantes.value.filter((x) => x.id !== nueva.id), nueva];
    sincronizado = true;
    return nueva;
  }

  async function actualizarVariante(id: string, datos: Omit<Variante, 'id'>): Promise<boolean> {
    if (existeCombinacionVariante(datos.productoId, datos.talle, datos.color, id)) {
      return false;
    }
    sincronizador.marcarMutacionLocal();
    const actualizada = await actualizarVarianteApi(id, datos);
    const idx = variantes.value.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    const copia = [...variantes.value];
    copia[idx] = actualizada;
    variantes.value = copia;
    sincronizado = true;
    return true;
  }

  async function eliminarVariante(id: string): Promise<boolean> {
    const variante = variantePorId(id);
    if (!variante) return false;
    const activasDelProducto = variantesDeProducto(variante.productoId);
    if (activasDelProducto.length <= 1 && variante.activa) return false;
    sincronizador.marcarMutacionLocal();
    await eliminarVarianteApi(id);
    variantes.value = variantes.value.filter((v) => v.id !== id);
    sincronizado = true;
    return true;
  }

  async function aplicarImportacionStockInicial(
    lineas: LineaImportarStockInicialApi[],
    observacion?: string,
  ): Promise<ResultadoImportarStockInicialApi> {
    sincronizador.marcarMutacionLocal();
    const resultado = await importarStockInicialApi({ lineas, observacion });
    sincronizado = false;
    await cargar({ forzar: true });
    return resultado;
  }

  return {
    categorias,
    productos,
    variantes,
    cargando,
    cargar,
    asegurarCargado,
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
    aplicarImportacionStockInicial,
  };
});
