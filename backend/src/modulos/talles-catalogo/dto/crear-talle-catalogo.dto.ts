import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { TipoTalleCatalogoApi } from '../../../comunes/constantes/talle-catalogo';

const TIPOS_TALLE = ['LETRA', 'NUMERO', 'OTRO'] as const satisfies readonly TipoTalleCatalogoApi[];

export class CrearTalleCatalogoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  nombre!: string;

  @IsOptional()
  @IsIn(TIPOS_TALLE)
  tipo?: TipoTalleCatalogoApi;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
