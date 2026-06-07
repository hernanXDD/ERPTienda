import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ID_CONFIGURACION_SISTEMA } from '../../comunes/constantes/id-configuracion-sistema';
import { decimalANumero } from '../../comunes/utilidades/mapear-decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarConfiguracionSistemaDto } from './dto/actualizar-configuracion-sistema.dto';

export interface ConfiguracionSistemaApi {
  id: string;
  maximoCuentaCorriente: number;
  porcentajeGananciaSugerida: number;
  diasDeudaCuentaCorriente: number;
  stockMinimoAlerta: number;
}

@Injectable()
export class ConfiguracionSistemaService {
  constructor(private readonly prisma: PrismaService) {}

  private mapear(registro: {
    id: string;
    maximoCuentaCorriente: Prisma.Decimal;
    porcentajeGananciaSugerida: Prisma.Decimal;
    diasDeudaCuentaCorriente: number;
    stockMinimoAlerta: number;
  }): ConfiguracionSistemaApi {
    return {
      id: registro.id,
      maximoCuentaCorriente: decimalANumero(registro.maximoCuentaCorriente),
      porcentajeGananciaSugerida: decimalANumero(registro.porcentajeGananciaSugerida),
      diasDeudaCuentaCorriente: registro.diasDeudaCuentaCorriente,
      stockMinimoAlerta: registro.stockMinimoAlerta,
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
        stockMinimoAlerta: datos.stockMinimoAlerta,
      },
    });
    return this.mapear(actualizado);
  }
}
