import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ActualizarFormaPagoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsBoolean()
  facturar!: boolean;

  @IsBoolean()
  habilitado!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
