import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { JwtStrategy } from './estrategias/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configuracion: ConfigService): JwtModuleOptions => {
        const expiracion = configuracion.get<string>('JWT_EXPIRES_IN', '8h');
        return {
          secret: configuracion.getOrThrow<string>('JWT_SECRETO'),
          signOptions: { expiresIn: expiracion as `${number}h` },
        };
      },
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, JwtStrategy],
  exports: [JwtModule, AutenticacionService],
})
export class AutenticacionModule {}
