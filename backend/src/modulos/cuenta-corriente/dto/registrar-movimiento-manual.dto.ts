import { TipoMovimientoCuentaCorriente } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarMovimientoManualDto {
  @IsEnum(TipoMovimientoCuentaCorriente)
  tipoMovimiento!: TipoMovimientoCuentaCorriente;

  @IsNumber()
  @Min(0.01)
  importe!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcion!: string;
}
