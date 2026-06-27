import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, Max, Min } from 'class-validator';
import {
  PLANTILLAS_CUPON_VALIDAS,
  type PlantillaCupon,
} from '../../../comunes/constantes/plantilla-cupon';

export class ActualizarConfiguracionSistemaDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999_999_999_999)
  maximoCuentaCorriente!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(999)
  porcentajeGananciaSugerida!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  diasDeudaCuentaCorriente!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  diasPlazoDevolucion!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  stockMinimoAlerta!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  diasDeshabilitarProductoStockCero!: number;

  @IsBoolean()
  movimientoManualStockHabilitado!: boolean;

  @IsIn(PLANTILLAS_CUPON_VALIDAS)
  plantillaCupon!: PlantillaCupon;
}
