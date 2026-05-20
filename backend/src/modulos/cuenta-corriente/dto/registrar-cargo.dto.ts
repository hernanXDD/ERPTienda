import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarCargoDto {
  @IsNumber()
  @Min(0.01)
  importe!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
