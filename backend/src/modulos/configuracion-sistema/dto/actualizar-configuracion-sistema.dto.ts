import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, Max, Min } from 'class-validator';

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
  @Min(0)
  @Max(9999)
  stockMinimoAlerta!: number;

  @IsBoolean()
  movimientoManualStockHabilitado!: boolean;
}
