import { Module } from '@nestjs/common';
import { LogoNegocioService } from './logo-negocio.service';
import { NegocioController } from './negocio.controller';
import { NegocioService } from './negocio.service';

@Module({
  controllers: [NegocioController],
  providers: [NegocioService, LogoNegocioService],
  exports: [NegocioService, LogoNegocioService],
})
export class NegocioModule {}
