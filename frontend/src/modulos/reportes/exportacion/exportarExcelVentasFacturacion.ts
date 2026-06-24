import ExcelJS from 'exceljs';
import {
  COLUMNAS_REPORTE_VENTAS_FACTURACION,
  type DatosReporteVentasFacturacion,
  nombreArchivoExcelVentasFacturacion,
} from '../calcular/calcularReporteVentasFacturacion';

const COLOR_MARCA = 'FF1E3A5F';
const COLOR_MARCA_CLARO = 'FFEEF2F7';
const COLOR_BORDE = 'FFCBD5E1';
const COLOR_FILA_PAR = 'FFF8FAFC';
const COLOR_TEXTO = 'FF0F172A';
const COLOR_TEXTO_APAGADO = 'FF64748B';

const ENCABEZADOS = [
  COLUMNAS_REPORTE_VENTAS_FACTURACION.fechaHora,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.numeroVenta,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.cliente,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.documento,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.condicionIva,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.importeNeto,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.moneda,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.formaPago,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.estadoFacturacion,
  COLUMNAS_REPORTE_VENTAS_FACTURACION.numeroFactura,
] as const;

const ANCHOS_COLUMNAS = [20, 14, 28, 18, 22, 14, 8, 18, 18, 16];

function aplicarBordeCelda(celda: ExcelJS.Cell): void {
  celda.border = {
    top: { style: 'thin', color: { argb: COLOR_BORDE } },
    left: { style: 'thin', color: { argb: COLOR_BORDE } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDE } },
    right: { style: 'thin', color: { argb: COLOR_BORDE } },
  };
}

function descargarBufferExcel(buffer: ArrayBuffer, nombreArchivo: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function exportarExcelVentasFacturacion(
  datos: DatosReporteVentasFacturacion,
  fechaDesde: string,
  fechaHasta: string,
): Promise<void> {
  if (datos.sinVentas) {
    throw new Error('No hay ventas en el período seleccionado para exportar.');
  }

  const libro = new ExcelJS.Workbook();
  libro.creator = 'ERP Tienda';
  libro.created = new Date();

  const hoja = libro.addWorksheet('Ventas a facturar', {
    views: [{ state: 'frozen', ySplit: 5, xSplit: 0 }],
    properties: { defaultRowHeight: 18 },
  });

  hoja.columns = ENCABEZADOS.map((encabezado, indice) => ({
    key: encabezado,
    width: ANCHOS_COLUMNAS[indice] ?? 16,
  }));

  hoja.mergeCells('A1:J1');
  const titulo = hoja.getCell('A1');
  titulo.value = datos.tituloReporte;
  titulo.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLOR_MARCA } };
  titulo.alignment = { vertical: 'middle', horizontal: 'left' };
  hoja.getRow(1).height = 28;

  hoja.mergeCells('A2:J2');
  const subtitulo = hoja.getCell('A2');
  const partesSubtitulo = [
    datos.negocioNombre,
    `Período: ${datos.rangoLegible}`,
    datos.filtroEntidadLegible,
  ];
  if (datos.filtroEstadoFacturacionLegible) {
    partesSubtitulo.push(datos.filtroEstadoFacturacionLegible);
  }
  subtitulo.value = partesSubtitulo.join(' · ');
  subtitulo.font = { name: 'Segoe UI', size: 10, color: { argb: COLOR_TEXTO_APAGADO } };
  subtitulo.alignment = { vertical: 'middle', horizontal: 'left' };

  hoja.mergeCells('A3:J3');
  const meta = hoja.getCell('A3');
  meta.value = `Generado el ${datos.generadoEl} · ${datos.cantidadOperaciones} operaciones · Total ${datos.totalImporte.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`;
  meta.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: COLOR_TEXTO_APAGADO } };
  meta.alignment = { vertical: 'middle', horizontal: 'left' };

  hoja.getRow(4).height = 6;

  const filaEncabezados = hoja.getRow(5);
  filaEncabezados.height = 22;
  ENCABEZADOS.forEach((encabezado, indice) => {
    const celda = filaEncabezados.getCell(indice + 1);
    celda.value = encabezado;
    celda.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_MARCA },
    };
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    aplicarBordeCelda(celda);
  });

  datos.filas.forEach((fila, indiceFila) => {
    const numeroFila = 6 + indiceFila;
    const filaExcel = hoja.getRow(numeroFila);
    const valores = [
      fila.fechaHora,
      fila.numeroVenta,
      fila.cliente,
      fila.documento,
      fila.condicionIva,
      fila.importeNeto,
      fila.moneda,
      fila.formaPago,
      fila.estadoFacturacion,
      fila.facturacion,
    ];

    valores.forEach((valor, indiceColumna) => {
      const celda = filaExcel.getCell(indiceColumna + 1);
      celda.value = valor;
      celda.font = { name: 'Segoe UI', size: 10, color: { argb: COLOR_TEXTO } };
      celda.alignment = {
        vertical: 'middle',
        horizontal: indiceColumna === 5 ? 'right' : 'left',
        wrapText: indiceColumna === 2,
      };
      if (indiceFila % 2 === 1) {
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR_FILA_PAR },
        };
      }
      aplicarBordeCelda(celda);
    });

    filaExcel.getCell(6).numFmt = '#,##0.00';
    filaExcel.height = 20;
  });

  hoja.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5 + datos.filas.length, column: ENCABEZADOS.length },
  };

  hoja.getColumn(6).numFmt = '#,##0.00';

  const filaPie = 6 + datos.filas.length + 1;
  hoja.mergeCells(`A${filaPie}:E${filaPie}`);
  const celdaPie = hoja.getCell(`A${filaPie}`);
  celdaPie.value =
    'Documento de apoyo para facturación. Verificá los datos antes de emitir comprobantes fiscales.';
  celdaPie.font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: COLOR_TEXTO_APAGADO } };

  hoja.mergeCells(`F${filaPie}:J${filaPie}`);
  const celdaTotal = hoja.getCell(`F${filaPie}`);
  celdaTotal.value = `Total período: ${datos.totalImporte.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${datos.filas[0]?.moneda ?? 'ARS'}`;
  celdaTotal.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLOR_MARCA } };
  celdaTotal.alignment = { horizontal: 'right' };
  celdaTotal.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_MARCA_CLARO },
  };

  const buffer = await libro.xlsx.writeBuffer();
  descargarBufferExcel(buffer, nombreArchivoExcelVentasFacturacion(fechaDesde, fechaHasta));
}
