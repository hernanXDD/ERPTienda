import {
  IsNotEmpty,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EsContrasenaSegura } from '../../../comunes/validadores/es-contrasena-segura.decorator';

@ValidatorConstraint({ name: 'contrasenasCoinciden', async: false })
class ContrasenasCoincidenConstraint implements ValidatorConstraintInterface {
  validate(_valor: unknown, args: ValidationArguments): boolean {
    const dto = args.object as CambioContrasenaInicialDto;
    return dto.contrasenaNueva === dto.contrasenaNuevaRepetida;
  }

  defaultMessage(): string {
    return 'Las contraseñas no coinciden.';
  }
}

export class CambioContrasenaInicialDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña nueva es obligatoria.' })
  @EsContrasenaSegura()
  contrasenaNueva!: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe repetir la contraseña.' })
  @Validate(ContrasenasCoincidenConstraint)
  contrasenaNuevaRepetida!: string;
}
