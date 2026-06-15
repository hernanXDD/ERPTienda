import { BadRequestException } from '@nestjs/common';

/** Tolerancia para comparar montos en pesos (centavos). */
export const TOLERANCIA_MONEDA = 0.01;

export function redondearMoneda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export interface LineaComprobanteValidable {
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface LineaComprobanteNormalizada {
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export function validarLineasYTotalComprobante(
  lineas: LineaComprobanteValidable[],
  totalInformado: number,
  etiquetaPrecio = 'precio unitario',
  ajusteMonto = 0,
): {
  lineasNormalizadas: LineaComprobanteNormalizada[];
  subtotalLineas: number;
  totalCalculado: number;
} {
  if (lineas.length === 0) {
    throw new BadRequestException('El comprobante debe incluir al menos una línea.');
  }

  const lineasNormalizadas: LineaComprobanteNormalizada[] = lineas.map((linea, indice) => {
    const subtotalEsperado = redondearMoneda(linea.cantidad * linea.precioUnitario);
    if (Math.abs(linea.subtotal - subtotalEsperado) > TOLERANCIA_MONEDA) {
      throw new BadRequestException(
        `La línea ${indice + 1} tiene un subtotal incorrecto (${etiquetaPrecio} × cantidad).`,
      );
    }
    return {
      cantidad: linea.cantidad,
      precioUnitario: redondearMoneda(linea.precioUnitario),
      subtotal: subtotalEsperado,
    };
  });

  const subtotalLineas = redondearMoneda(
    lineasNormalizadas.reduce((acum, ln) => acum + ln.subtotal, 0),
  );
  const ajusteRedondeado = redondearMoneda(ajusteMonto);
  const totalCalculado = redondearMoneda(subtotalLineas + ajusteRedondeado);

  if (totalCalculado < -TOLERANCIA_MONEDA) {
    throw new BadRequestException('El total del comprobante no puede ser negativo.');
  }

  if (Math.abs(totalInformado - totalCalculado) > TOLERANCIA_MONEDA) {
    throw new BadRequestException('El total no coincide con las líneas y el ajuste del comprobante.');
  }

  return { lineasNormalizadas, subtotalLineas, totalCalculado };
}
