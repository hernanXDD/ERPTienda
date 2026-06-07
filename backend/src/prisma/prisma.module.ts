import { Global, Module } from '@nestjs/common';
import { IdSecuenciaService } from './id-secuencia.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, IdSecuenciaService],
  exports: [PrismaService, IdSecuenciaService],
})
export class PrismaModule {}
