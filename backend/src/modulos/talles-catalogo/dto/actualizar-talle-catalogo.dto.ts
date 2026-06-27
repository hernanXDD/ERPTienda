import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { TipoTalleCatalogoApi } from '../../../comunes/constantes/talle-catalogo';

const TIPOS_TALLE = ['LETRA', 'NUMERO', 'OTRO'] as const satisfies readonly TipoTalleCatalogoApi[];

export class ActualizarTalleCatalogoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsIn(TIPOS_TALLE)
  tipo!: TipoTalleCatalogoApi;

  @IsBoolean()
  habilitado!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
