import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CondicionIvaCliente } from '@prisma/client';
import { transformarCadenaVaciaComoUndefined } from '../../../comunes/validadores/transformar-cadena-vacia';

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
  @Transform(transformarCadenaVaciaComoUndefined)
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

  @IsOptional()
  @IsEnum(CondicionIvaCliente)
  condicionIva?: CondicionIvaCliente;
}
