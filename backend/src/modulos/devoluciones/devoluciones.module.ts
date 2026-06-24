import { Module } from '@nestjs/common';
import { CuentaCorrienteModule } from '../cuenta-corriente/cuenta-corriente.module';
import { StockModule } from '../stock/stock.module';
import { DevolucionesController } from './devoluciones.controller';
import { DevolucionesService } from './devoluciones.service';

@Module({
  imports: [StockModule, CuentaCorrienteModule],
  controllers: [DevolucionesController],
  providers: [DevolucionesService],
  exports: [DevolucionesService],
})
export class DevolucionesModule {}
