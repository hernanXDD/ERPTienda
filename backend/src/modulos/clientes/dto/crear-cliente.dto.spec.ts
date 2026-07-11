import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearClienteDto } from './crear-cliente.dto';

describe('CrearClienteDto', () => {
  const datosBase = {
    nombre: 'Cliente prueba',
    documento: '30.123.456',
  };

  it('acepta correo y dirección vacíos', async () => {
    const dto = plainToInstance(CrearClienteDto, {
      ...datosBase,
      correoElectronico: '',
      direccion: '',
    });

    const errores = await validate(dto);
    expect(errores).toHaveLength(0);
  });

  it('rechaza correo con formato inválido', async () => {
    const dto = plainToInstance(CrearClienteDto, {
      ...datosBase,
      correoElectronico: 'no-es-mail',
    });

    const errores = await validate(dto);
    expect(errores.some((e) => e.property === 'correoElectronico')).toBe(true);
  });
});
