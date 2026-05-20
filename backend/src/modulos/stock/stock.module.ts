import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [CatalogoModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
