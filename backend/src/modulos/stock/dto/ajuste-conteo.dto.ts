import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AjusteConteoDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @Min(0)
  cantidadFisicaContada!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
