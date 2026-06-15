import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CrearProveedorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  documento!: string;

  @IsOptional()
  @ValidateIf((_, valor) => typeof valor === 'string' && valor.trim() !== '')
  @IsEmail()
  @MaxLength(255)
  correoElectronico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefonoPrincipal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefonoAlternativo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limiteCreditoCompras?: number;

  @IsOptional()
  @IsBoolean()
  comprasCreditoHabilitadas?: boolean;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
