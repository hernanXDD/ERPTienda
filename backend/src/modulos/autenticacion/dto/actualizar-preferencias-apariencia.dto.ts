import { IsBoolean } from 'class-validator';

export class ActualizarPreferenciasAparienciaDto {
  @IsBoolean()
  modoOscuroHabilitado!: boolean;
}
