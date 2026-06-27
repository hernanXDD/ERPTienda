import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ID_CONFIGURACION_SISTEMA } from '../../comunes/constantes/id-configuracion-sistema';
import type { PlantillaCupon } from '../../comunes/constantes/plantilla-cupon';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarConfiguracionSistemaDto } from './dto/actualizar-configuracion-sistema.dto';

export interface ConfiguracionSistemaApi {
  id: string;
  maximoCuentaCorriente: number;
  porcentajeGananciaSugerida: number;
  diasDeudaCuentaCorriente: number;
  diasPlazoDevolucion: number;
  stockMinimoAlerta: number;
  diasDeshabilitarProductoStockCero: number;
  movimientoManualStockHabilitado: boolean;
  plantillaCupon: PlantillaCupon;
}

@Injectable()
export class ConfiguracionSistemaService {
  constructor(private readonly prisma: PrismaService) {}

  private mapear(registro: {
    id: string;
    maximoCuentaCorriente: Prisma.Decimal;
    porcentajeGananciaSugerida: Prisma.Decimal;
    diasDeudaCuentaCorriente: number;
    diasPlazoDevolucion: number;
    stockMinimoAlerta: number;
    diasDeshabilitarProductoStockCero: number;
    movimientoManualStockHabilitado: boolean;
    plantillaCupon: string;
  }): ConfiguracionSistemaApi {
    return {
      id: registro.id,
      maximoCuentaCorriente: decimalANumero(registro.maximoCuentaCorriente),
      porcentajeGananciaSugerida: decimalANumero(registro.porcentajeGananciaSugerida),
      diasDeudaCuentaCorriente: registro.diasDeudaCuentaCorriente,
      diasPlazoDevolucion: registro.diasPlazoDevolucion,
      stockMinimoAlerta: registro.stockMinimoAlerta,
      diasDeshabilitarProductoStockCero: registro.diasDeshabilitarProductoStockCero,
      movimientoManualStockHabilitado: registro.movimientoManualStockHabilitado,
      plantillaCupon: registro.plantillaCupon as PlantillaCupon,
    };
  }

  async obtener(): Promise<ConfiguracionSistemaApi> {
    const registro = await this.prisma.configuracionSistema.findUnique({
      where: { id: ID_CONFIGURACION_SISTEMA },
    });
    if (!registro) {
      throw new NotFoundException('No se encontró la configuración del sistema.');
    }
    return this.mapear(registro);
  }

  async actualizar(datos: ActualizarConfiguracionSistemaDto): Promise<ConfiguracionSistemaApi> {
    const actualizado = await this.prisma.configuracionSistema.update({
      where: { id: ID_CONFIGURACION_SISTEMA },
      data: {
        maximoCuentaCorriente: new Prisma.Decimal(Math.floor(datos.maximoCuentaCorriente)),
        porcentajeGananciaSugerida: new Prisma.Decimal(
          Math.round(datos.porcentajeGananciaSugerida * 100) / 100,
        ),
        diasDeudaCuentaCorriente: datos.diasDeudaCuentaCorriente,
        diasPlazoDevolucion: datos.diasPlazoDevolucion,
        stockMinimoAlerta: datos.stockMinimoAlerta,
        diasDeshabilitarProductoStockCero: datos.diasDeshabilitarProductoStockCero,
        movimientoManualStockHabilitado: datos.movimientoManualStockHabilitado,
        plantillaCupon: datos.plantillaCupon,
      },
    });
    return this.mapear(actualizado);
  }
}
