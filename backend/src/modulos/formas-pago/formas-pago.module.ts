import { Module } from '@nestjs/common';
import { FormasPagoController } from './formas-pago.controller';
import { FormasPagoService } from './formas-pago.service';

@Module({
  controllers: [FormasPagoController],
  providers: [FormasPagoService],
  exports: [FormasPagoService],
})
export class FormasPagoModule {}
