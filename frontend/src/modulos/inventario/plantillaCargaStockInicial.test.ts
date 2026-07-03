import { describe, expect, it } from 'vitest';
import {
  contarProductosUnicosCargaStock,
  parsearArchivoCargaStockInicial,
} from './plantillaCargaStockInicial';
import { codigoBarrasDesdeIdVariante } from '../catalogo/codigoBarras';
import * as XLSX from 'xlsx';

function crearArchivoExcel(filas: Record<string, string | number>[]): File {
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Productos');
  const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' });
  return new File([buffer], 'carga.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('plantillaCargaStockInicial', () => {
  const categorias = [{ id: '000001', nombre: 'Remeras', descripcion: '' }];

  it('parsea filas válidas y agrupa productos por nombre/marca/categoría', async () => {
    const archivo = crearArchivoExcel([
      {
        Nombre: 'Remera básica',
        Marca: 'Marca A',
        Categoría: 'Remeras',
        'Precio de venta': 10000,
        Descripción: 'Algodón',
        Talle: 'M',
        'Código de barras': '',
        Stock: 4,
      },
      {
        Nombre: 'Remera básica',
        Marca: 'Marca A',
        Categoría: 'Remeras',
        'Precio de venta': 10000,
        Descripción: 'Algodón',
        Talle: 'L',
        'Código de barras': '',
        Stock: 2,
      },
    ]);

    const resultado = await parsearArchivoCargaStockInicial(archivo, categorias, new Set(), [], [], () => 0);
    expect(resultado.errores).toEqual([]);
    expect(resultado.lineas).toHaveLength(2);
    expect(contarProductosUnicosCargaStock(resultado.lineas)).toBe(1);
    expect(resultado.lineas.every((linea) => /^\d{13}$/.test(linea.codigoBarras ?? ''))).toBe(true);
  });

  it('reconoce artículos existentes y arma actualización de stock', async () => {
    const codigoBarras = codigoBarrasDesdeIdVariante('000101');
    const archivo = crearArchivoExcel([
      {
        Nombre: 'Pantalón jean',
        Marca: 'Marca A',
        Categoría: 'Remeras',
        'Precio de venta': 20000,
        Descripción: '',
        Talle: '42',
        'Código de barras': codigoBarras,
        Stock: 8,
      },
    ]);

    const resultado = await parsearArchivoCargaStockInicial(
      archivo,
      categorias,
      new Set([codigoBarras]),
      [{ id: '000001', nombre: 'Pantalón jean', marca: 'Marca A', categoriaId: '000001' }],
      [
        {
          id: '000101',
          productoId: '000001',
          talle: '42',
          color: '',
          codigoBarras,
        },
      ],
      () => 0,
    );

    expect(resultado.errores).toEqual([]);
    expect(resultado.lineas).toHaveLength(0);
    expect(resultado.actualizacionesStock).toHaveLength(1);
    expect(resultado.actualizacionesStock[0]?.stockNuevo).toBe(8);
  });

  it('agrega un talle nuevo a un producto existente', async () => {
    const archivo = crearArchivoExcel([
      {
        Nombre: 'Vestido urban',
        Marca: 'Marca A',
        Categoría: 'Remeras',
        'Precio de venta': 25000,
        Descripción: '',
        Talle: '2',
        'Código de barras': '',
        Stock: 3,
      },
    ]);

    const resultado = await parsearArchivoCargaStockInicial(
      archivo,
      categorias,
      new Set(),
      [{ id: '000001', nombre: 'Vestido urban', marca: 'Marca A', categoriaId: '000001' }],
      [
        {
          id: '000101',
          productoId: '000001',
          talle: 'M',
          color: '',
          codigoBarras: '',
        },
      ],
      () => 0,
    );

    expect(resultado.errores).toEqual([]);
    expect(resultado.lineas).toHaveLength(1);
    expect(resultado.lineas[0]?.productoId).toBe('000001');
    expect(resultado.lineas[0]?.talle).toBe('2');
    expect(resultado.lineas[0]?.stock).toBe(3);
  });

  it('rechaza código de barras que pertenece a otro producto', async () => {
    const codigoBarras = codigoBarrasDesdeIdVariante('000101');
    const archivo = crearArchivoExcel([
      {
        Nombre: 'Vestido urban 2',
        Marca: 'Marca A',
        Categoría: 'Remeras',
        'Precio de venta': 25000,
        Descripción: '',
        Talle: 'M',
        'Código de barras': codigoBarras,
        Stock: 1,
      },
    ]);

    const resultado = await parsearArchivoCargaStockInicial(
      archivo,
      categorias,
      new Set([codigoBarras]),
      [{ id: '000001', nombre: 'Vestido urban', marca: 'Marca A', categoriaId: '000001' }],
      [
        {
          id: '000101',
          productoId: '000001',
          talle: 'M',
          color: '',
          codigoBarras,
        },
      ],
      () => 0,
    );

    expect(resultado.lineas).toHaveLength(0);
    expect(resultado.errores.some((error) => error.includes('código de barras pertenece'))).toBe(true);
  });

  it('rechaza categoría inexistente', async () => {
    const archivo = crearArchivoExcel([
      {
        Nombre: 'Pantalón',
        Marca: 'Marca A',
        Categoría: 'Inexistente',
        'Precio de venta': 10000,
        Descripción: '',
        Talle: '42',
        'Código de barras': '',
        Stock: 1,
      },
    ]);

    const resultado = await parsearArchivoCargaStockInicial(archivo, categorias, new Set(), [], [], () => 0);
    expect(resultado.lineas).toHaveLength(0);
    expect(resultado.errores.some((error) => error.includes('categoría'))).toBe(true);
  });
});
