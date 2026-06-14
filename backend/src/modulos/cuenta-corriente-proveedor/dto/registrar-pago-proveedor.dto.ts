import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarPagoProveedorDto {
  @IsNumber()
  @Min(0.01)
  importe!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  formaDePagoEtiqueta!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenciaDelPagoOpcional?: string;
}
