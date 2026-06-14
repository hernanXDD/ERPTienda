import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarCargoProveedorDto {
  @IsNumber()
  @Min(0.01)
  importe!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}
