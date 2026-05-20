import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CrearVarianteDto {
  @IsUUID()
  productoId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  talle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  color!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  codigoBarras?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
