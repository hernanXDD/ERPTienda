import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  documento!: string;

  @IsOptional()
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
  limiteCompraCuentaCorriente?: number;

  @IsOptional()
  @IsBoolean()
  cuentaCorrienteHabilitada?: boolean;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
